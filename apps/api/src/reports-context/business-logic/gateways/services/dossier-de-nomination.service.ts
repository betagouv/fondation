import { DossierDeNominationSnapshot } from 'src/nominations-context/business-logic/models/dossier-de-nomination';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';

export type DossierDeNominationDto<
  S extends TypeDeSaisine | unknown = unknown,
> = DossierDeNominationSnapshot<S>;

export interface DossierDeNominationService<
  S extends TypeDeSaisine | unknown = unknown,
> {
  dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationDto<S>>;
}
