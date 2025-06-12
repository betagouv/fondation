import xlsx from 'node-xlsx';
import { Gender, Magistrat, Role } from 'shared-models';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { TransparenceSnapshot } from '../../models/transparence';

export const nouvellTranspaEventId = 'event-id';
export const unNomTransparenceXlsx = 'une-transparence.xlsx';

export const lucLoïcReporterId = 'luc-loic-reporter-id';
export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const jocelinReporterId = 'jocelin-reporter-id';
export const jocelinUser = {
  userId: jocelinReporterId,
  firstName: 'martin-luc',
  lastName: 'josselin-martel',
  fullName: 'JOSSELIN-MARTEL Martin-Luc',
  email: 'martin-luc@example.fr',
  password: 'some-password',
  role: Role.MEMBRE_DU_SIEGE,
  gender: Gender.M,
};

export const currentDate = new Date(2024, 10, 10);

type Colonne =
  | 'N°'
  | 'Magistrat'
  | 'Poste cible'
  | 'Date de naissance'
  | 'Poste actuel'
  | 'Prise de fonction'
  | 'Passage au grade'
  | 'Eq./Av.'
  | 'Observants'
  | 'Rapporteur'
  | 'Information carrière'
  | 'Historique';

type Ligne = Record<Colonne, string | number | null>;

export const unNomMagistrat = 'Elise PREGENT ep. QUIMPER';

const ligne1 = {
  'N°': '12345',
  Magistrat: `${unNomMagistrat}\n(1 sur une liste de 7)`,
  'Poste cible': 'Procureur de la République TJ  RENNES – I',
  'Date de naissance': '1/1/1971',
  'Poste actuel': 'Procureur de la République TJ  CAMBRAI',
  'Prise de fonction': '5/9/2021',
  'Passage au grade': '27/3/2012',
  'Eq./Av.': Avancement.EQUIVALENCE,
  Observants: 'un observant',
  Rapporteur: `${lucLoïcUser.fullName}\n${jocelinUser.fullName}`,
  'Information carrière': '',
  Historique: '- Biographie de E - poste 2',
} satisfies Ligne;

export const genTransparenceXlsxBuffer = (ligne: Ligne = ligne1) =>
  xlsx.build([
    {
      name: 'mySheetName',
      data: [[], [], Object.keys(ligne), Object.values(ligne)],
      options: {},
    },
  ]);

export const genXlsxTestFile = (ligneOverride?: Partial<Ligne>) => {
  const ligne: Ligne = {
    ...ligne1,
    ...ligneOverride,
  };

  return new File([genTransparenceXlsxBuffer(ligne)], unNomTransparenceXlsx, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const posteCibleProfilé =
  'Substitut Vice-procureur du ministère de la justice AC PARIS - I - [P] [SMACJ - DACS]';
const posteCibleProfiléAvecRetourALaLigne = `Avocat Général CA LYON - HH\n [P][ALEDA]`;

export const uneTransparenceXlsxSiège = genXlsxTestFile();
export const uneTransparenceXlsxInvalide = genXlsxTestFile({
  'N°': 'ABC',
});

export const unXlsxProfilé = genXlsxTestFile({
  'Poste cible': posteCibleProfilé,
  'Eq./Av.': Avancement.AVANCEMENT,
});
export const unXlsxProfiléAvecRetourALaLigne = genXlsxTestFile({
  'Poste cible': posteCibleProfiléAvecRetourALaLigne,
  'Eq./Av.': Avancement.AVANCEMENT,
});

export const genDossierSiège = (
  content?: Partial<NominationFileModelSnapshot['content']>,
): NominationFileModelSnapshot => ({
  id: 'un-dossier-siege-id',
  createdAt: currentDate,
  rowNumber: 1,
  content: {
    numeroDeDossier: Number(ligne1['N°']),
    magistrat: ligne1.Magistrat,
    posteCible: ligne1['Poste cible'],
    dateDeNaissance: {
      day: 1,
      month: 1,
      year: 1971,
    },
    posteActuel: ligne1['Poste actuel'],
    datePriseDeFonctionPosteActuel: {
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
    reporters: [lucLoïcUser.fullName, jocelinUser.fullName],
    informationCarriere: null,
    historique: ligne1.Historique || null,
    rank: '(1 sur une liste de 7)',
    ...content,
  },
});

export const unDossierParquet = genDossierSiège();
export const unDossierSiège = genDossierSiège();
export const unDossierSiègeProfilé = genDossierSiège({
  magistrat: unNomMagistrat,
  posteCible: posteCibleProfilé,
  grade: Magistrat.Grade.II,
  equivalenceOuAvancement: Avancement.AVANCEMENT,
});
export const unDossierSiègeProfiléAvecRetourALaLigne = genDossierSiège({
  magistrat: unNomMagistrat,
  posteCible: `Avocat Général CA LYON - HH [P][ALEDA]`,
  grade: Magistrat.Grade.I,
  equivalenceOuAvancement: Avancement.AVANCEMENT,
});

export const genUneTransparence = (dossier: NominationFileModelSnapshot) =>
  ({
    id: 'une-transparence-id',
    createdAt: currentDate,
    formation: Magistrat.Formation.SIEGE,
    name: 'Une Transparence',
    dateEchéance: {
      day: 1,
      month: 1,
      year: 2025,
    },
    dateTransparence: {
      day: 1,
      month: 1,
      year: 2024,
    },
    datePriseDePosteCible: {
      day: 1,
      month: 1,
      year: 2027,
    },
    dateClôtureDélaiObservation: {
      day: 1,
      month: 10,
      year: 2023,
    },
    nominationFiles: [dossier],
  }) satisfies TransparenceSnapshot;

export const uneTransparence = genUneTransparence({
  ...unDossierSiège,
  content: {
    ...unDossierSiège.content,
    magistrat: unNomMagistrat,
  },
});

export const uneTransparenceAvecProfilé = genUneTransparence(
  unDossierSiègeProfilé,
);
export const uneTransparenceAvecProfiléAvecRetourALaLigne = genUneTransparence(
  unDossierSiègeProfiléAvecRetourALaLigne,
);
