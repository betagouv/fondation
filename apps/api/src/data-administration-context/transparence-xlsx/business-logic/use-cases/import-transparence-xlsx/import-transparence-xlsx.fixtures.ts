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
  | 'N°'
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
  'N°': '12345',
  Magistrat: 'Elise PREGENT ep. QUIMPER (1 sur une liste de 7)',
  'Poste cible': 'Procureur de la République TJ  RENNES – I',
  'Date de naissance': '1/1/1971',
  'Poste actuel': 'Procureur de la République TJ  CAMBRAI',
  'Prise de fonction': '5/9/2021',
  'Passage au grade': '27/3/2012',
  'Eq./Av.': Avancement.EQUIVALENCE,
  Observants: 'un observant',
  'Information carrière': '',
  Historique: '- Biographie de E - poste 2',
  'Rapporteur 1': lucLoïcUser.fullName,
  'Rapporteur 2': '',
  'Rapporteur 3 (note de synthèse pour le président de formation)': '',
} satisfies Ligne;

const genXlsxFile = (ligneOverride?: Partial<Ligne>) => {
  const ligne = {
    ...ligne1,
    ...ligneOverride,
  };
  return new File(
    [
      xlsx.build([
        {
          name: 'mySheetName',
          data: [
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
            Object.keys(ligne),
            Object.values(ligne),
          ],
          options: {},
        },
      ]),
    ],
    'une-transparence.xlsx',
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  );
};

const posteCibleProfilé =
  'Substitut Vice-procureur du ministère de la justice AC PARIS - I - [P] [SMACJ - DACS]';
const posteCibleProfiléAvecRetourALaLigne = `Avocat Général CA LYON - HH\n [P][ALEDA]`;

export const uneTransparenceXlsx = genXlsxFile();
export const unXlsxProfilé = genXlsxFile({
  'Poste cible': posteCibleProfilé,
  'Eq./Av.': Avancement.AVANCEMENT,
});
export const unXlsxProfiléAvecRetourALaLigne = genXlsxFile({
  'Poste cible': posteCibleProfiléAvecRetourALaLigne,
  'Eq./Av.': Avancement.AVANCEMENT,
});

const genDossierSiège = (
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
    reporters: [lucLoïcUser.fullName],
    informationCarriere: null,
    historique: ligne1.Historique || null,
    ...content,
  },
});

export const unDossierSiège: NominationFileModelSnapshot = genDossierSiège();
export const unDossierSiègeProfilé: NominationFileModelSnapshot =
  genDossierSiège({
    posteCible: posteCibleProfilé,
    grade: Magistrat.Grade.II,
    equivalenceOuAvancement: Avancement.AVANCEMENT,
  });
export const unDossierSiègeProfiléAvecRetourALaLigne: NominationFileModelSnapshot =
  genDossierSiège({
    posteCible: `Avocat Général CA LYON - HH [P][ALEDA]`,
    grade: Magistrat.Grade.I,
    equivalenceOuAvancement: Avancement.AVANCEMENT,
  });

const genUneTransparence = (
  dossier: NominationFileModelSnapshot,
): TransparenceSnapshot => ({
  id: 'une-transparence-id',
  createdAt: currentDate,
  formation: Magistrat.Formation.SIEGE,
  name: 'Une Transparence',
  nominationFiles: [dossier],
});

export const uneTransparence = genUneTransparence(unDossierSiège);

export const uneTransparenceAvecProfilé = genUneTransparence(
  unDossierSiègeProfilé,
);
export const uneTransparenceAvecProfiléAvecRetourALaLigne = genUneTransparence(
  unDossierSiègeProfiléAvecRetourALaLigne,
);
