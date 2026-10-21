import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertNever } from '../../../../../utils/assert-never';
import { Db } from '../../../../framework/database';
import { DocInvalidation } from '../../../shared/domain/doc-invalidation';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
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
        return this.updateAgendasReporters(invalidation);

      case 'AgendaDateUpdated':
      case 'AgendaFileBlockEdited':
      case 'AgendaNominationFilesUpdated':
      case 'AgendaValidated':
      case 'NominationFilesOutcomeUpdated':
      case 'SessionDateUpdated':
        return;

      default:
        return assertNever(invalidation);
    }
  }

  private async updateAgendasReporters(
    invalidation: Extract<DocInvalidation, { type: 'SessionAffectationVersionPublished' }>,
  ): Promise<void> {
    const { sessionId } = invalidation.payload;

    const agendas = await this.db.tx.agendaVersion.findMany({
      where: { agenda: { sessionId: invalidation.payload.sessionId } },
      distinct: ['agendaId'],
      orderBy: { version: 'desc' },
      select: {
        agendaId: true,
        nominationFiles: { select: { nominationFileId: true } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    const allNominationFileIds = new Set(
      agendas.flatMap((a) =>
        a.nominationFiles.flatMap(({ nominationFileId }) => (nominationFileId ? [nominationFileId] : [])),
      ),
    );
    const { items: updatedNominationFiles } = await this.docsNominationFilesFinder.find({
      sessionId,
      ids: [...allNominationFileIds],
    });

    const nominationFilesPerId = new Map(updatedNominationFiles.map((file) => [file.id, file]));

    for (const { agendaId, nominationFiles } of agendas) {
      const agenda = await this.agendaRepository.find({ actorId: null, agendaId });
      agenda.updateFilesReporters({
        nominationFiles: nominationFiles.flatMap(({ nominationFileId }) => {
          if (!nominationFileId) return [];
          const nf = nominationFilesPerId.get(nominationFileId);
          if (!nf) return [];

          const reporters = nf.reporters.map((r) => r.fullTitledName);
          return [{ id: nf.id, reporters }];
        }),
      });
      await this.agendaRepository.persist(agenda);
    }
  }
}
