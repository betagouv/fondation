import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import {
  DocNominationFileOutcomeEnum,
  docNominationFileOutcomeLabel,
  nominationFileOutcomeToDocNominationFileOutcome,
} from '../../domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import type { InternalFoundAgendaNominationFiles } from 'src/modules/session/transparence/infrastructure/queries/internal-find-docs-nomination-files.query';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';

import { ReportedNominationFilesFinder } from './reported-nomination-files.finder';

@Injectable()
export class DocsNominationFilesFinder {
  constructor(
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,

    private readonly reportedNominationFilesFinder: ReportedNominationFilesFinder,

    private readonly db: Db,
  ) {}

  @Transactional()
  async find(query: {
    sessionId: string;
    formation?: FormationEnum;
    ids?: readonly string[];
  }): Promise<FoundDocsNominationFiles> {
    const found = await this.sessions.internalFindNominationFiles({
      ids: query.ids,
      sessionId: query.sessionId,
    });

    return { items: await this.withDocsOutcomes(found, query) };
  }

  @Transactional()
  async findForAgenda(query: { sessionId: string }): Promise<FoundAgendaNominationFiles> {
    const found = await this.sessions.internalFindNominationFiles({ sessionId: query.sessionId });
    const sessionNominationFiles = await this.withDocsOutcomes(found, query);

    const reportedNominationFiles = await this.reportedNominationFilesFinder.find({
      fileIds: new Set(sessionNominationFiles.map(({ id }) => id)),
    });
    const reportedState = (id: string) => reportedNominationFiles.reportedState({ nominationFileId: id });

    return {
      items: sessionNominationFiles.filter(({ id }) => reportedState(id) === 'NONE'),
      ineligible: [
        ...sessionNominationFiles.flatMap(({ id }) => {
          const state = reportedState(id);
          if (state === 'NONE') return [];

          return [
            { id, reason: state === 'VALIDATED' ? ('REPORTED' as const) : ('DRAFT_REPORTED' as const) },
          ];
        }),
        ...found.unidentifiedIds.map((id) => ({ id, reason: 'UNIDENTIFIED' as const })),
      ],
    };
  }

  private async withDocsOutcomes(
    found: InternalFoundAgendaNominationFiles,
    query: { sessionId: string; formation?: FormationEnum },
  ): Promise<FoundDocsNominationFiles['items']> {
    const items = found.items as FoundDocsNominationFiles['items'];
    if (items.length === 0) return [];

    const formation =
      query.formation ?? (await this.sessions.internalGetSessionFormation({ sessionId: query.sessionId }));

    return items.map((file) => {
      if (!file.outcome) return file;

      file.outcome.value = nominationFileOutcomeToDocNominationFileOutcome(file.outcome.value);
      file.outcome.label = docNominationFileOutcomeLabel({ outcome: file.outcome.value, formation });
      return file;
    });
  }

  @Transactional()
  async findNonReported(query: {
    sessionId: string;
    formation?: FormationEnum;
    ignoreOfficialReportId?: string;
    ids?: readonly string[];
  }): Promise<FoundDocsNominationFiles> {
    const { items: sessionNominationFiles } = await this.find(query);
    if (sessionNominationFiles.length === 0) return { items: [] };

    const fileIds = new Set(sessionNominationFiles.map((f) => f.id));
    const reportedNominationFiles = await this.reportedNominationFilesFinder.find({
      fileIds,
      ignoreOfficialReportId: query.ignoreOfficialReportId,
    });

    const items = sessionNominationFiles.filter(
      (file) =>
        !reportedNominationFiles.isReported({
          nominationFileId: file.id,
          ignoreOfficialReportId: query.ignoreOfficialReportId,
        }),
    );

    return { items };
  }

  @Transactional()
  async findNonReportedByAgendaIds(query: {
    agendaIds: Set<string>;
    ignoreOfficialReportId?: string;
  }): Promise<FoundDocsNominationFiles> {
    const agendaList = await this.db.tx.agenda.findMany({
      where: { id: { in: [...query.agendaIds] } },
      select: {
        id: true,
        sessionId: true,
        nominationFiles: {
          where: { nominationFileId: { not: null } },
          select: { nominationFileId: true },
        },
      },
    });

    const bySessionId = Map.groupBy(agendaList, (x) => x.sessionId);

    const allItems: FoundDocsNominationFiles['items'] = [];
    for (const [sessionId, list] of bySessionId) {
      const { items } = await this.findNonReported({
        sessionId,
        ids: list.flatMap((x): string[] =>
          x.nominationFiles
            .map(({ nominationFileId }) => nominationFileId)
            .filter((x): x is string => Boolean(x)),
        ),
      });

      allItems.push(...items);
    }

    return { items: allItems };
  }
}

export class FoundDocsNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        number: z.number(),
        reporters: z.array(
          z.object({
            id: z.string(),
            gender: z.enum(GenderEnum),
            firstName: z.string(),
            lastName: z.string(),
            fullTitledName: z.string(),
          }),
        ),

        outcome: z
          .object({
            value: z.enum(DocNominationFileOutcomeEnum),
            label: z.string(),
            comment: z.string().nullable(),
          })
          .nullable(),

        magistrat: z.object({
          id: z.string(),
          externalId: z.number().int().gt(0),
          name: z.string(),
          position: z.object({
            grade: z.enum(GradeEnum),
            label: z.string(),
            functionId: z.string().nullable(),
            jurisdictionId: z.string().nullable(),
          }),
        }),

        targetPosition: z.object({
          grade: z.enum(GradeEnum),
          label: z.string(),
          functionId: z.string().nullable(),
          jurisdictionId: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}

export const AGENDA_INELIGIBILITY_REASONS = ['REPORTED', 'DRAFT_REPORTED', 'UNIDENTIFIED'] as const;

export class FoundAgendaNominationFiles extends createZodDto(
  FoundDocsNominationFiles.schema.extend({
    ineligible: z.array(
      z.object({
        id: z.uuid(),
        reason: z.enum(AGENDA_INELIGIBILITY_REASONS),
      }),
    ),
  }),
) {}
