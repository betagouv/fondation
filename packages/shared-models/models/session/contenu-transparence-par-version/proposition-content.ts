import { DateOnlyJson } from "../../date";
import { Magistrat } from "../../magistrat.namespace";

export type ContenuInconnu = object;
export interface ContenuPropositionDeNominationTransparenceV1 {
  version?: 1;
  folderNumber: number | null;
  name: string;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
  datePassageAuGrade: DateOnlyJson | null;
  datePriseDeFonctionPosteActuel: DateOnlyJson | null;
  informationCarrière: string | null;
}

export type ContenuV1 = ContenuPropositionDeNominationTransparenceV1;

export interface ContenuPropositionDeNominationTransparenceV2 {
  version: 2;
  numeroDeDossier: number | null;
  nomMagistrat: string;
  posteCible: string;
  dateDeNaissance: DateOnlyJson;
  posteActuel: string;
  grade: Magistrat.Grade;
  observants: string[] | null;
  historique: string | null;
  rang: string;
  datePassageAuGrade: DateOnlyJson | null;
  datePriseDeFonctionPosteActuel: DateOnlyJson | null;
  informationCarrière: string | null;
  dateEchéance: DateOnlyJson | null;
}

export type ContenuV2 = ContenuPropositionDeNominationTransparenceV2;


