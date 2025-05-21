import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DossierDeNomination } from '../../models/dossier-de-nomination';

export interface DossierDeNominationRepository {
  save(dossier: DossierDeNomination): TransactionableAsync;
  dossierDeNomination(
    id: string,
  ): TransactionableAsync<DossierDeNomination | null>;
  findByImportedId(
    importedId: string,
  ): TransactionableAsync<DossierDeNomination | null>;
}
