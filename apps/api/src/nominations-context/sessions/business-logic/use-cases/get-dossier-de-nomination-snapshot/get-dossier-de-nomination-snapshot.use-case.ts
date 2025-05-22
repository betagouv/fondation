import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DossierDeNominationRepository } from '../../gateways/repositories/dossier-de-nomination.repository';
import { DossierDeNominationSnapshot } from '../../models/dossier-de-nomination';
import { TypeDeSaisine } from 'shared-models';

export class GetDossierDeNominationSnapshotUseCase {
  constructor(
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute<T extends TypeDeSaisine | unknown = unknown>(
    id: string,
  ): Promise<DossierDeNominationSnapshot<T> | null> {
    return this.transactionPerformer.perform(async (trx) => {
      const dossier =
        await this.dossierDeNominationRepository.dossierDeNomination(id)(trx);
      return dossier?.snapshot() ?? null;
    });
  }
}
