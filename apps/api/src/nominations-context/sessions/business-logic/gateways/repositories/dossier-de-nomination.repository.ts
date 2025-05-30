import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DossierDeNomination } from '../../models/dossier-de-nomination';
import { TypeDeSaisine } from 'shared-models';

export interface DossierDeNominationRepository<
  S extends TypeDeSaisine | unknown = unknown,
> {
  save(dossier: DossierDeNomination<S>): TransactionableAsync;
  dossierDeNomination(
    id: string,
  ): TransactionableAsync<DossierDeNomination<S> | null>;
  findByImportedId(
    importedId: string,
  ): TransactionableAsync<DossierDeNomination<S> | null>;
}
