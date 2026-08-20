import { http, HttpResponse } from 'msw';

import { GradeEnum } from '@/types/enums.types';
import type {
  CountedUnaffectedFilesDto,
  ListedCurrentlyAffectedReportersDto,
  ListedMemberSessionReportsDto,
  NominationFilesStatusCountDto,
  PaginatedMemberListItemDto,
  PaginatedNominationFiles,
  SomeAffectationVersion,
} from '@api/types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type ListedMember = PaginatedMemberListItemDto['items'][number];

export type SessionDataset = {
  affectationsVersion?: SomeAffectationVersion;
  files: readonly SessionNominationFile[];
  memberReports?: ListedMemberSessionReportsDto['items'];
  members?: readonly ListedMember[];
};

const DEFAULT_PAGE_SIZE = 100;

const NO_VALUE = 'null';

/** mirrors `gradeEnumToSortableTargetedGrade` on the API which the list query sorts on */
const SORTABLE_TARGETED_GRADE: Record<GradeEnum, number> = {
  G1: 32,
  G2: 31,
  G3: 30,
  G3sup: 29,
  HH: 10,
  I: 20,
  II: 30,
  III: 10,
};

const sortValues = {
  fileNumber: (file: SessionNominationFile) => file.content.numeroDeDossier ?? 0,
  name: (file: SessionNominationFile) => file.content.nomMagistrat,
  targetedGrade: (file: SessionNominationFile) =>
    file.content.gradeCible ? SORTABLE_TARGETED_GRADE[file.content.gradeCible] : 0,
  targetedPosition: (file: SessionNominationFile) => file.content.posteCible ?? '',
};

function isSortable(sortBy: string | null): sortBy is keyof typeof sortValues {
  return !!sortBy && sortBy in sortValues;
}

function compare(a: number | string, b: number | string) {
  return a > b ? 1 : a < b ? -1 : 0;
}

function matchesSearch(file: SessionNominationFile, search: string) {
  return [file.content.nomMagistrat, file.content.posteCible, `${file.content.numeroDeDossier}`].some(
    (value) => value?.toLowerCase().includes(search),
  );
}

function matchesAny(values: readonly string[], selected: readonly string[]) {
  return (values.length ? values : [NO_VALUE]).some((value) => selected.includes(value));
}

function matchesFilters(file: SessionNominationFile, query: URLSearchParams) {
  const search = query.get('search')?.trim().toLowerCase();
  const priorities = query.getAll('priorities');
  const reporterIds = query.getAll('reporterIds');
  const outcomes = query.get('outcomes')?.split(',').filter(Boolean) ?? [];
  const fileReporterIds = file.reporters.map(({ id }) => id);

  if (search && !matchesSearch(file, search)) return false;
  if (priorities.length && !matchesAny(file.priorities, priorities)) return false;
  if (reporterIds.length && !matchesAny(fileReporterIds, reporterIds)) return false;
  if (outcomes.length && !outcomes.includes(file.content.outcome?.value ?? NO_VALUE)) return false;

  return true;
}

const draftAffectationsVersion: SomeAffectationVersion = {
  '@type': 'fr.csm.fondation.affectations.version.some',
  author: null,
  id: 'affectations-version-1',
  publicationDate: null,
  status: 'BROUILLON',
  version: 1,
};

/**
 * Serves the whole session screen from in-memory datasets keyed by session id: the paginated list applies
 * the search, the filters, the sorting and the pagination, and the surrounding widgets count that same list.
 *
 * @warning a docs page renders every story against the same worker, so the dataset must come from the
 * requested session rather than from a per-story `msw.use()`, which the last rendered story would win.
 */
export function makeSessionHandlers(sessions: Record<string, SessionDataset>) {
  const datasetOf = (sessionId: string | readonly string[] | undefined): SessionDataset =>
    sessions[String(sessionId)] ?? { files: [] };

  const allMembers = [
    ...new Map(
      Object.values(sessions)
        .flatMap(({ members = [] }) => members)
        .map((member) => [member.id, member]),
    ).values(),
  ];

  return [
    http.get('*/api/sessions/v2/:sessionId/files', ({ params, request }) => {
      const query = new URL(request.url).searchParams;
      const filtered = datasetOf(params.sessionId).files.filter((file) => matchesFilters(file, query));

      const sortBy = query.get('sortBy');
      const direction = query.get('sortDesc') === 'true' ? -1 : 1;
      const valueOf = isSortable(sortBy) ? sortValues[sortBy] : sortValues.fileNumber;
      const sorted = [...filtered].sort(
        (a, b) =>
          compare(valueOf(a), valueOf(b)) * direction ||
          compare(sortValues.fileNumber(a), sortValues.fileNumber(b)),
      );

      const limit = Number(query.get('limit')) || DEFAULT_PAGE_SIZE;
      const page = Number(query.get('page')) || 1;

      return HttpResponse.json<PaginatedNominationFiles>({
        currentPageIndex: page,
        items: sorted.slice((page - 1) * limit, page * limit),
        nextPageIndex: page * limit < sorted.length ? page + 1 : undefined,
        totalCount: sorted.length,
      });
    }),

    http.get('*/api/sessions/v2/:sessionId/files/status-counts', ({ params }) => {
      const { files } = datasetOf(params.sessionId);

      return HttpResponse.json<NominationFilesStatusCountDto>({
        inProgress: files.filter(({ content, reporters }) => reporters.length && !content.outcome).length,
        missingEvaluation: files.filter(({ missingEvaluation }) => missingEvaluation).length,
        missingEvaluationWithComment: files.filter(
          ({ missingEvaluation, missingEvaluationComment }) =>
            missingEvaluation && !!missingEvaluationComment,
        ).length,
        total: files.length,
        unaffected: files.filter(({ reporters }) => !reporters.length).length,
        withOutcome: files.filter(({ content }) => !!content.outcome).length,
      });
    }),

    http.get('*/api/sessions/v2/:sessionId/files/reporters/versions/last', ({ params }) =>
      HttpResponse.json<SomeAffectationVersion>(
        datasetOf(params.sessionId).affectationsVersion ?? draftAffectationsVersion,
      ),
    ),

    http.get('*/api/sessions/v2/:sessionId/files/reporters/versions/last/unaffected-count', ({ params }) =>
      HttpResponse.json<CountedUnaffectedFilesDto>({
        count: datasetOf(params.sessionId).files.filter(({ reporters }) => !reporters.length).length,
      }),
    ),

    http.get('*/api/sessions/v2/:sessionId/files/reporters/versions/last/members', ({ params }) =>
      HttpResponse.json<ListedCurrentlyAffectedReportersDto>({
        items: [
          ...new Map(
            datasetOf(params.sessionId)
              .files.flatMap(({ reporters }) => reporters)
              .map((reporter) => [reporter.id, reporter]),
          ).values(),
        ],
      }),
    ),

    http.get(
      '*/api/members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/reports',
      ({ params }) =>
        HttpResponse.json<ListedMemberSessionReportsDto>({
          items: datasetOf(params.sessionId).memberReports ?? [],
        }),
    ),

    http.get('*/api/members/v1', () =>
      HttpResponse.json<PaginatedMemberListItemDto>({
        currentPageIndex: 1,
        items: allMembers,
        totalCount: allMembers.length,
      }),
    ),
  ];
}
