import { TypeDeSaisine } from 'shared-models';
import { DossierDeNomination } from 'src/nominations-context/dossier-de-nominations/business-logic/models/dossier-de-nomination';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

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
  findBySessionId(
    sessionId: string,
  ): TransactionableAsync<DossierDeNomination<S>[]>;
}
