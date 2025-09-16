import { TypeDeSaisine } from 'shared-models';
import {
  ContenuPropositionDeNominationTransparenceV1,
  ContenuPropositionDeNominationTransparenceV2,
} from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import {
  DossierDeNominationContent,
  DossierDeNominationSnapshot,
} from 'shared-models/models/session/dossier-de-nomination-content';

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
