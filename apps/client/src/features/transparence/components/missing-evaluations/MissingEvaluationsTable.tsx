import { createColumnHelper, type CellContext } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { AffectationVersionStatusBadge } from '@/features/nomination-files-table/components/AffectationVersionStatusBadge';
import { NominationFilesExportButton } from '@/features/nomination-files-table/components/NominationFilesExportButton';
import { SessionFilesTable } from '@/features/nomination-files-table/components/SessionFilesTable';
import {
  useNominationFilesTable,
  type SessionOutcome,
} from '@/features/nomination-files-table/context/files-table.context';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '@/features/nomination-files-table/hooks/useSessionFilesFilters';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import { rowCell } from '@/shared/ui/new-table';
import { TotalBadge } from '@/shared/ui/total-badge';
import type { FormationEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useListMissingEvaluationsAsExcelMutation,
  useNominationFilesStatusCountsQuery,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { MissingEvaluationCommentCell, MissingEvaluationCommentProvider } from './MissingEvaluationComment';
import { MissingEvaluationDoneButton } from './MissingEvaluationDoneButton';

const h = createColumnHelper<SessionNominationFile>();

const fileNumberCell = rowCell<SessionNominationFile>((file) => file.content.numeroDeDossier);

function MagistratCell(props: CellContext<SessionNominationFile, string>) {
  const { sessionId } = useNominationFilesTable();
  const file = props.row.original;

  return (
    <div className="flex flex-col items-start gap-y-0.5">
      <Link
        to={{
          pathname: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }),
          search: `?dossier=${file.id}`,
        }}
      >
        {file.content.nomMagistrat}
      </Link>
      <span className="text-xs leading-5">
        <GradeAndPosition grade={file.content.grade} position={file.content.posteActuel} />
      </span>
    </div>
  );
}

const posteCibleCell = rowCell<SessionNominationFile>((file) => (
  <GradeAndPosition grade={file.content.gradeCible} position={file.content.posteCible} />
));
const reportersCell = rowCell<SessionNominationFile>((file) => (
  <ReporterTagList reporters={file.reporters} />
));
const commentCell = rowCell<SessionNominationFile>((file) => (
  <MissingEvaluationCommentCell
    comment={file.missingEvaluationComment}
    disabled={!file.content.isUpdatable}
    magistrat={file.content.nomMagistrat}
    nominationFileId={file.id}
  />
));

function EvaluationStatusCell(props: CellContext<SessionNominationFile, unknown>) {
  const { sessionId } = useNominationFilesTable();
  const file = props.row.original;

  return (
    <MissingEvaluationDoneButton
      disabled={!file.content.isUpdatable}
      magistrat={file.content.nomMagistrat}
      nominationFileId={file.id}
      sessionId={sessionId}
    />
  );
}

function useMissingEvaluationsColumns() {
  const { formatMessage } = useIntl();
  const filters = useSessionFilesFilters();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: fileNumberCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        size: 42,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: MagistratCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        size: 250,
      }),

      h.accessor('content.posteCible', {
        id: 'targetedPosition',
        cell: posteCibleCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 240,
      }),

      h.accessor('reporters', {
        cell: reportersCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('missingEvaluationComment', {
        cell: commentCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Commentaire' }),
        size: 260,
      }),

      h.display({
        id: 'status',
        cell: EvaluationStatusCell,
        header: formatMessage({ defaultMessage: 'Statut de l’évaluation' }),
        size: 220,
      }),
    ],
    [filters, formatMessage],
  );
}

function MissingEvaluationsTableInner(props: { filtersSlot: Element | null; sessionId: string }) {
  const { formatMessage } = useIntl();
  const columns = useMissingEvaluationsColumns();
  const exportAsExcel = useListMissingEvaluationsAsExcelMutation();
  const { data: counts } = useNominationFilesStatusCountsQuery({ sessionId: props.sessionId });

  return (
    <SessionFilesTable
      columns={columns}
      emptyLabel={formatMessage({ defaultMessage: 'Aucune évaluation manquante' })}
      filtersSlot={props.filtersSlot}
      restrictTo={{ missingEvaluation: true }}
      summary={() => (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <AffectationVersionStatusBadge sessionId={props.sessionId} />
            <TotalBadge value={counts?.missingEvaluation ?? 0}>
              <FormattedMessage defaultMessage="Total" />
            </TotalBadge>
            <TotalBadge value={counts?.missingEvaluationWithComment ?? 0}>
              <FormattedMessage
                defaultMessage="{count, plural, one {Commentaire} other {Commentaires}}"
                values={{ count: counts?.missingEvaluationWithComment ?? 0 }}
              />
            </TotalBadge>
          </div>

          <NominationFilesExportButton
            disabled={exportAsExcel.isPending}
            onExport={() => exportAsExcel.mutate({ sessionId: props.sessionId })}
          />
        </div>
      )}
    />
  );
}

export function MissingEvaluationsTable(props: {
  canManage: boolean;
  filtersSlot: Element | null;
  formation: FormationEnum;
  outcomes: readonly SessionOutcome[];
  sessionId: string;
}) {
  return (
    <NominationFilesTableProvider
      canManage={props.canManage}
      formation={props.formation}
      outcomes={props.outcomes}
      sessionId={props.sessionId}
    >
      <MissingEvaluationCommentProvider sessionId={props.sessionId}>
        <MissingEvaluationsTableInner filtersSlot={props.filtersSlot} sessionId={props.sessionId} />
      </MissingEvaluationCommentProvider>
    </NominationFilesTableProvider>
  );
}
