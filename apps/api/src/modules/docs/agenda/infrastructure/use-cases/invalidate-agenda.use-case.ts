import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { AgendaRepository } from '../repositories/agenda.repository';
import { DocInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';

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
      case 'AgendaNominationFilesUpdated':
      case 'NominationFileOutcomeUpdated':
      case 'SessionDateUpdated':
        return;

      default:
        return assertNever(invalidation);
    }
  }

  @Transactional()
  private async updateAgendasReporters(
    invalidation: Extract<DocInvalidation, { type: 'SessionAffectationVersionPublished' }>,
  ): Promise<void> {
    const { sessionId } = invalidation.payload;

    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: invalidation.payload.sessionId },
      select: {
        id: true,
        nominationFiles: { select: { nominationFileId: true } },
      },
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

    for (const { id, nominationFiles } of agendas) {
      const agenda = await this.agendaRepository.find({ agendaId: id });
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
