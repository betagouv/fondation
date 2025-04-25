import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { AffectationRepository } from '../../gateways/repositories/affectation.repository';
import { Affectation } from '../../models/affectation';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class AffectationRapporteursTransparenceTsvUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly affectationRepository: AffectationRepository,
  ) {}

  async execute(
    payload: GdsNewTransparenceImportedEventPayload,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      for (const formation of payload.formations) {
        const affectation = new Affectation(
          payload.transparenceId,
          formation,
          payload.nominationFiles
            .filter((nominationFile) => !!nominationFile.reporterIds?.length)
            .map((nominationFile) => ({
              dossierDeNominationId: nominationFile.transparency,
              rapporteurIds: nominationFile.reporterIds!,
            }))
            .flat(),
        );

        await this.affectationRepository.save(affectation)(trx);
      }
    });
  }
}
