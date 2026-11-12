import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertNever } from '../../../../../utils/assert-never';
import { Db } from '../../../../framework/database';
import { DocInvalidation } from '../../../shared/domain/doc-invalidation';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
import { namedMembersOf } from '../../../shared/infrastructure/named-members';
import { AgendaRepository } from '../repositories/agenda.repository';

@Injectable()
export class InvalidateAgendasUseCase {
  constructor(
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
  ) {}

  async handle(invalidation: DocInvalidation): Promise<void> {
    switch (invalidation.type) {
      case 'SessionAffectationVersionPublished':
        return this.updateSessionAgendasReporters(invalidation);

      case 'MemberRenamed':
        return this.followRenamedMember(invalidation);

      case 'AgendaDateUpdated':
      case 'AgendaFileBlockEdited':
      case 'AgendaNominationFilesUpdated':
      case 'AgendaValidated':
      case 'NominationFilesOutcomeUpdated':
      case 'NominationFilesRecusalsUpdated':
      case 'SessionDateUpdated':
        return;

      default:
        return assertNever(invalidation);
    }
  }

  private async updateSessionAgendasReporters(
    invalidation: Extract<DocInvalidation, { type: 'SessionAffectationVersionPublished' }>,
  ): Promise<void> {
    const { sessionId } = invalidation.payload;

    const agendas = await this.db.tx.agendaVersion.findMany({
      where: { agenda: { sessionId } },
      distinct: ['agendaId'],
      orderBy: { version: 'desc' },
      select: {
        agendaId: true,
        nominationFiles: { select: { nominationFileId: true } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    await this.updateReporters({ agendas, sessionId });
  }

  /**
   * a validated agenda keeps the name it was sent with: only the drafts naming the member follow.
   * TODO: see InvalidateOfficialReportUseCase.mapMemberRenamed, which finds the reports naming the member
   */
  private async followRenamedMember(
    invalidation: Extract<DocInvalidation, { type: 'MemberRenamed' }>,
  ): Promise<void> {
    const files = await this.db.tx.agendaNominationFile.findMany({
      where: {
        reporters: { array_contains: [{ id: invalidation.payload.userId }] },
        version: { status: 'DRAFT' },
      },
      select: {
        nominationFileId: true,
        version: { select: { agenda: { select: { sessionId: true } }, agendaId: true } },
      } satisfies Prisma.AgendaNominationFileSelect,
    });

    const filesPerSession = Map.groupBy(files, ({ version }) => version.agenda.sessionId);
    for (const [sessionId, sessionFiles] of filesPerSession) {
      const filesPerAgenda = Map.groupBy(sessionFiles, ({ version }) => version.agendaId);

      await this.updateReporters({
        agendas: [...filesPerAgenda].map(([agendaId, nominationFiles]) => ({ agendaId, nominationFiles })),
        sessionId,
      });
    }
  }

  private async updateReporters(command: {
    agendas: readonly { agendaId: string; nominationFiles: readonly { nominationFileId: string | null }[] }[];
    sessionId: string;
  }): Promise<void> {
    const nominationFileIdsOf = (files: readonly { nominationFileId: string | null }[]) =>
      files.flatMap(({ nominationFileId }) => nominationFileId ?? []);

    const { items } = await this.docsNominationFilesFinder.find({
      ids: [
        ...new Set(command.agendas.flatMap(({ nominationFiles }) => nominationFileIdsOf(nominationFiles))),
      ],
      sessionId: command.sessionId,
    });
    const nominationFilesPerId = new Map(items.map((file) => [file.id, file]));

    for (const { agendaId, nominationFiles: agendaFiles } of command.agendas) {
      const nominationFiles = nominationFileIdsOf(agendaFiles).flatMap((id) => {
        const file = nominationFilesPerId.get(id);
        return file ? [{ id, reporters: namedMembersOf(file.reporters) }] : [];
      });

      const agenda = await this.agendaRepository.find({ actorId: null, agendaId });
      agenda.updateFilesReporters({ nominationFiles });
      await this.agendaRepository.persist(agenda);
    }
  }
}
