import { Magistrat } from 'models/magistrat.namespace';
import type { PrioriteEnum } from '../priorite.enum';
import { DateOnlyJson } from 'models/date';

export type DossierDeNominationContent = {
  folderNumber: number | null;
  name: string;
  formation: Magistrat.Formation | null;
  dueDate: DateOnlyJson | null;
  grade: Magistrat.Grade;
  currentPosition: string;
  targetedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[];
  lastRankingDate: DateOnlyJson | null;
  lastPositionDate: DateOnlyJson | null;
};

export type DossierDeNominationSnapshot = {
  id: string;
  sessionId: string;
  nominationFileImportedId: string;
  content: DossierDeNominationContent;
};

export type RapporteurInfo = {
  userId: string;
  nom: string;
};

export type DossierDeNominationEtAffectationSnapshot = DossierDeNominationSnapshot & {
  rapporteurs: RapporteurInfo[];
  priorite?: PrioriteEnum;
};

export type AffectationMetadata = {
  statut: 'BROUILLON' | 'PUBLIEE';
  version: number;
  datePublication?: Date;
  auteurPublication?: string;
};

export type DossiersEtAffectationResponse = {
  dossiers: DossierDeNominationEtAffectationSnapshot[];
  metadata: AffectationMetadata | null;
};
