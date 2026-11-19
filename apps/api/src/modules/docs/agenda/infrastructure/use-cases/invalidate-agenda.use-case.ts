import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { lockAgendasRawQuery } from '../../../../../generated/prisma/sql';
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

    // a draft discarded meanwhile hands back the files of its validated version: they are read after the lock
    const sessionAgendas = await this.db.tx.agenda.findMany({
      where: { sessionId },
      select: { id: true } satisfies Prisma.AgendaSelect,
    });
    await this.db.tx.$queryRawTyped(lockAgendasRawQuery(sessionAgendas.map(({ id }) => id)));

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

    const { chairman, drafts } = await this.findRenamedChairmanDrafts(invalidation.payload);

    // one sorted batch, as a second one could wait on the agendas a publication locked in the other order.
    // A draft discarded between these reads and the lock leaves its validated version, which keeps the
    // name it was sent with: reading before the lock loses nothing.
    await this.db.tx.$queryRawTyped(
      lockAgendasRawQuery([
        ...new Set([
          ...files.map(({ version }) => version.agendaId),
          ...drafts.map(({ agendaId }) => agendaId),
        ]),
      ]),
    );

    const filesPerSession = Map.groupBy(files, ({ version }) => version.agenda.sessionId);
    for (const [sessionId, sessionFiles] of filesPerSession) {
      const filesPerAgenda = Map.groupBy(sessionFiles, ({ version }) => version.agendaId);

      await this.updateReporters({
        agendas: [...filesPerAgenda].map(([agendaId, nominationFiles]) => ({ agendaId, nominationFiles })),
        sessionId,
      });
    }

    for (const { agendaId } of drafts) {
      const agenda = await this.agendaRepository.find({ actorId: null, agendaId });
      agenda.followChairmanName(chairman);
      await this.agendaRepository.persist(agenda);
    }
  }

  /** a new recusal title sends the same invalidation: only the drafts signed with another name are loaded */
  private async findRenamedChairmanDrafts(member: { userId: string }): Promise<{
    chairman: { firstName: string; id: string; lastName: string };
    drafts: readonly { agendaId: string }[];
  }> {
    const chairman = await this.db.tx.user.findUniqueOrThrow({
      where: { id: member.userId },
      select: { firstName: true, id: true, lastName: true } satisfies Prisma.UserSelect,
    });

    const drafts = await this.db.tx.agendaVersion.findMany({
      where: {
        chairmanId: chairman.id,
        status: 'DRAFT',
        OR: [
          { chairmanFirstName: { not: chairman.firstName } },
          { chairmanLastName: { not: chairman.lastName } },
        ],
      },
      select: { agendaId: true } satisfies Prisma.AgendaVersionSelect,
    });

    return { chairman, drafts };
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
