import { Magistrat, Transparency } from 'shared-models';
import { NominationFileRead } from 'src/data-administration-context/business-logic/models/nomination-file-read';

export function getExpectedContents(): NominationFileRead['content'][] {
  return [
    {
      folderNumber: 1,
      biography:
        '- blabla julien pierre   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 11,
        month: 10,
        year: 1979,
      },
      currentPosition: 'Vice-président TJ BEAUVAIS',
      dueDate: {
        day: 10,
        month: 11,
        year: 2024,
      },
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.I,
      name: 'Julien Pierre',
      rank: '(1 sur une liste de 4)',
      reporters: ['ROUSSIN Jules'],
      observers: [
        'LUCIEN MARC VPI TJ NANTES\n(2 sur une liste de 4)',
        'DAMIEN JEAN\n(2 sur une liste de 100)\nProcureur TJ de Marseilles',
      ],
      rules: {
        management: {
          TRANSFER_TIME: true,
          CASSATION_COURT_NOMINATION: false,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: true,
          GRADE_REGISTRATION: true,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: true,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: true,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: true,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: true,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: false,
          HH_NOMINATION_CONDITIONS: false,
        },
      },
      targettedPosition:
        "Premier vice-président chargé de l'instruction TJ MARSEILLE - I",
      transparency: Transparency.AUTOMNE_2024,
    },
    {
      folderNumber: 2,
      biography:
        '- blabla dupont marcel   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 16,
        month: 1,
        year: 1981,
      },
      currentPosition:
        "Premier substitut à l'administration centrale du ministère de la justice AC MARSEILLE",
      dueDate: {
        day: 1,
        month: 12,
        year: 2025,
      },
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.I,
      name: 'Dupont Marcel',
      rank: '(1 sur une liste de 1)',
      reporters: ['ROUSSIN Jules'],
      observers: null,
      rules: {
        management: {
          CASSATION_COURT_NOMINATION: true,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: true,
          TRANSFER_TIME: true,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: true,
          HH_NOMINATION_CONDITIONS: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: false,
          GRADE_REGISTRATION: false,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: false,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: false,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: false,
        },
      },
      targettedPosition: 'Premier vice-président adjoint TJ RENNES - I',
      transparency: Transparency.AUTOMNE_2024,
    },
    {
      folderNumber: 5,
      biography:
        '- blabla brusse émilien   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 24,
        month: 2,
        year: 1987,
      },
      currentPosition: 'DETACHEMENT',
      dueDate: null,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'Brusse Emilien Ep. François',
      rank: '1 sur une liste de 12)',
      reporters: ['ROUSSIN Jules', 'JOSSELIN-MARTEL Martin-Luc'],
      observers: ['LUDIVINE Jeanne'],
      rules: {
        management: {
          CASSATION_COURT_NOMINATION: true,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: true,
          TRANSFER_TIME: false,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: false,
          HH_NOMINATION_CONDITIONS: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: false,
          GRADE_REGISTRATION: false,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: false,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: true,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: false,
        },
      },
      targettedPosition:
        "Premier substitut à l'administration centrale du ministère de la justice AC PARIS - I",
      transparency: Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
    },
  ];
}
