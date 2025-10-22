import { TypeDeSaisine } from "../type-de-saisine.enum";
import type { ContenuInconnu, ContenuPropositionDeNominationTransparenceV1, ContenuPropositionDeNominationTransparenceV2 } from "./contenu-transparence-par-version/proposition-content";
import type { PrioriteEnum } from "../priorite.enum";

export type DossierDeNominationContent<
  S extends TypeDeSaisine | unknown = unknown,
> = S extends TypeDeSaisine.TRANSPARENCE_GDS
  ?
      | ContenuPropositionDeNominationTransparenceV1
      | ContenuPropositionDeNominationTransparenceV2
  : ContenuInconnu;

export type DossierDeNominationSnapshot<
  S extends TypeDeSaisine | unknown = unknown,
  Content extends DossierDeNominationContent<S> = DossierDeNominationContent<S>,
> = {
  id: string;
  sessionId: string;
  nominationFileImportedId: string;
  content: Content;
};

export type RapporteurInfo = {
  userId: string;
  nom: string;
};

export type DossierDeNominationEtAffectationSnapshot = DossierDeNominationSnapshot & {
  rapporteurs: RapporteurInfo[];
  priorite?: PrioriteEnum;
};