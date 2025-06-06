import { TypeDeSaisine } from 'shared-models';
import {
  ContenuPropositionDeNominationTransparenceV1,
  ContenuPropositionDeNominationTransparenceV2,
} from 'src/nominations-context/pp-gds/transparences/business-logic/models/proposition-de-nomination';
import {
  DossierDeNominationContent,
  DossierDeNominationSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';

export type DossierDeNominationDto<
  S extends TypeDeSaisine | unknown = unknown,
  Content extends DossierDeNominationContent<S> = DossierDeNominationContent<S>,
> = DossierDeNominationSnapshot<S, Content>;

export type PropositionDeNominationTransparenceDto =
  DossierDeNominationDto<TypeDeSaisine.TRANSPARENCE_GDS>;

export type PropositionDeNominationTransparenceV1Dto = DossierDeNominationDto<
  TypeDeSaisine.TRANSPARENCE_GDS,
  ContenuPropositionDeNominationTransparenceV1
>;

export type PropositionDeNominationTransparenceV2Dto = DossierDeNominationDto<
  TypeDeSaisine.TRANSPARENCE_GDS,
  ContenuPropositionDeNominationTransparenceV2
>;

export interface DossierDeNominationService<
  S extends TypeDeSaisine | unknown = unknown,
> {
  dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationDto<S>>;
}
