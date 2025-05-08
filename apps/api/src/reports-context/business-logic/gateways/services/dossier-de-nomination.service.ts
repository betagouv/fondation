import { DossierDeNominationSnapshot } from 'src/nominations-context/business-logic/models/dossier-de-nomination';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';

export interface DossierDeNominationService<S extends TypeDeSaisine> {
  dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationSnapshot<S>>;
}
