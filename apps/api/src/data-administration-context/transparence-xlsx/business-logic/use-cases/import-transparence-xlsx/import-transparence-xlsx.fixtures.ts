import xlsx from 'node-xlsx';
import { Gender, Magistrat, Role } from 'shared-models';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { TransparenceSnapshot } from '../../models/transparence';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';

export const lucLoïcReporterId = 'luc-loic-reporter-id';

export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const currentDate = new Date(2024, 10, 10);

type Colonne =
  | 'N° dossier'
  | 'Magistrat'
  | 'Poste cible'
  | 'Date de naissance'
  | 'Poste actuel'
  | 'Prise de fonction'
  | 'Passage au grade'
  | 'Eq./Av.'
  | 'Observants'
  | 'Information carrière'
  | 'Historique'
  | 'Rapporteur 1'
  | 'Rapporteur 2'
  | 'Rapporteur 3 (note de synthèse pour le président de formation)';

type Ligne = Record<Colonne, string | number | null>;

const ligne1 = {
  'N° dossier': '12345',
  Magistrat: 'Elise PREGENT ep. QUIMPER (1 sur une liste de 7)',
  'Poste cible': 'Procureur de la République TJ  RENNES – I',
  'Date de naissance': '1/01/1971',
  'Poste actuel': 'Procureur de la République TJ  CAMBRAI',
  'Prise de fonction': '5/09/2021',
  'Passage au grade': '27/03/2012',
  'Eq./Av.': Avancement.EQUIVALENCE,
  Observants: 'un observant',
  'Information carrière': '',
  Historique: '- Biographie de E - poste 2',
  'Rapporteur 1': lucLoïcUser.fullName,
  'Rapporteur 2': '',
  'Rapporteur 3 (note de synthèse pour le président de formation)': '',
} satisfies Ligne;

const data = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  Object.keys(ligne1),
  Object.values(ligne1),
];

const buffer = xlsx.build([
  {
    name: 'mySheetName',
    data,
    options: {},
  },
]);
export const uneTransparenceXlsx = new File([buffer], 'une-transparence.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

export const unDossierSiège: NominationFileModelSnapshot = {
  id: 'un-dossier-siege-id',
  createdAt: currentDate,
  rowNumber: 1,
  content: {
    numeroDeDossier: Number(ligne1['N° dossier']),
    magistrat: ligne1.Magistrat,
    posteCible: ligne1['Poste cible'],
    dateDeNaissance: {
      day: 1,
      month: 1,
      year: 1971,
    },
    posteActuel: ligne1['Poste actuel'],
    priseDeFonction: {
      day: 5,
      month: 9,
      year: 2021,
    },
    datePassageAuGrade: {
      day: 27,
      month: 3,
      year: 2012,
    },
    equivalenceOuAvancement: ligne1['Eq./Av.'],
    grade: Magistrat.Grade.I,
    observers: ligne1.Observants ? [ligne1.Observants] : [],
    reporters: [lucLoïcUser.fullName],
    informationCarriere: ligne1['Information carrière'],
    historique: ligne1.Historique || null,
  },
};
export const uneTransparence = {
  id: 'une-transparence-id',
  createdAt: currentDate,
  formation: Magistrat.Formation.SIEGE,
  name: 'Une Transparence',
  nominationFiles: [unDossierSiège],
} satisfies TransparenceSnapshot;
