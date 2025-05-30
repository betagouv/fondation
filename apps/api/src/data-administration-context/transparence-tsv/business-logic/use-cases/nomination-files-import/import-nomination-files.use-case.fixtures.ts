import {
  Gender,
  Magistrat,
  NominationFile,
  Role,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { PartialDeep } from 'type-fest';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { GSHEET_CELL_LINE_BREAK_TOKEN } from '../../models/nomination-file-content-reader';
import { NominationFileRead } from '../../models/nomination-file-read';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from '../../models/rules';
import { Avancement } from '../../../../lodam/business-logic/models/avancement';

export const gdsTransparenceEventId = 'gds-transparence-event-id';
export const gdsTransparenceId = 'gds-transparence-id';
export const gdsTransparenceName = Transparency.AUTOMNE_2024;
export const currentDate = new Date(2024, 10, 10);

export const anObserverString = `  FIRST OBSERVER${GSHEET_CELL_LINE_BREAK_TOKEN} (1 sur 2)${GSHEET_CELL_LINE_BREAK_TOKEN}TJ de Rennes`;
export const anObserverExpected = 'FIRST OBSERVER\n(1 sur 2)\nTJ de Rennes';

export const lucLoïcReporterId = 'luc-loic-reporter-id';
export const emilienRenaudJulesReporterId = 'emilien-renaud-jules-reporter-id';
export const jeanneLouiseDeFranceAudeReporterId =
  'jeanne-louise-de-france-aude-reporter-id';

export const lucLoïcUser = {
  userId: lucLoïcReporterId,
  firstName: 'LOIC',
  lastName: 'LUC',
  fullName: 'LUC Loïc',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const emilienRenaudJulesUser = {
  userId: emilienRenaudJulesReporterId,
  firstName: 'Jules',
  lastName: 'ÉMILIEN-RENAUD',
  fullName: 'ÉMILIEN-RENAUD Jules ep. Françoise',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
export const jeanneLouiseDeFranceAudeUser = {
  userId: jeanneLouiseDeFranceAudeReporterId,
  firstName: 'AUDREY',
  lastName: 'JEANNE LOUISE DE FRANCE',
  fullName: 'JEANNE LOUISE DE FRANCE Aude',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.F,
};

export const getMarcelDupontModelSnapshotFactory =
  (dateTimeProvider: DeterministicDateProvider) =>
  (
    uuid: string,
    rowNumber = 1,
    moreContent?: PartialDeep<
      Omit<NominationFileRead['content'], 'dueDate' | 'birthDate' | 'rules'>
    >,
    rules = new NominationFileReadRulesBuilder().build(),
  ): NominationFileModelSnapshot => ({
    id: uuid,
    createdAt: dateTimeProvider.currentDate,
    rowNumber,
    content: getMarcelDupontRead(rowNumber, moreContent, rules).content,
  });
export type GetMarcelDupontModelSnapshot = ReturnType<
  typeof getMarcelDupontModelSnapshotFactory
>;

export const getLucienPierreModelSnapshotFactory =
  (dateTimeProvider: DeterministicDateProvider) =>
  (
    uuid: string,
    rowNumber = 1,
    moreContent?: PartialDeep<
      Omit<NominationFileRead['content'], 'dueDate' | 'birthDate' | 'rules'>
    >,
    rules = getReadRules({
      [NominationFile.RuleGroup.STATUTORY]: {
        [NominationFile.StatutoryRule.MINISTER_CABINET]: true,
      },
    }),
  ): NominationFileModelSnapshot => ({
    id: uuid,
    createdAt: dateTimeProvider.currentDate,
    rowNumber,
    content: getLucienPierreRead(rowNumber, moreContent, rules).content,
  });
export type GetLucienPierreModelSnapshot = ReturnType<
  typeof getLucienPierreModelSnapshotFactory
>;

export const getMarcelDupontRead = (
  rowNumber = 1,
  moreContent?: PartialDeep<
    Omit<
      NominationFileRead['content'],
      | 'dueDate'
      | 'birthDate'
      | 'datePriseDeFonctionPosteActuel'
      | 'datePassageAuGrade'
      | 'rules'
    >
  >,
  rules = new NominationFileReadRulesBuilder().build(),
): NominationFileRead => ({
  rowNumber,
  content: {
    folderNumber: 1,
    name: 'Marcel Dupont Ep. François',
    formation: Magistrat.Formation.SIEGE,
    dueDate: {
      year: 2024,
      month: 11,
      day: 10,
    },
    transparency: Transparency.AUTOMNE_2024,
    reporters: [
      'LUC Loïc',
      'ÉMILIEN-RENAUD Jules ep. Françoise',
      'JEANNE LOUISE DE FRANCE Aude',
    ],
    datePriseDeFonctionPosteActuel: {
      year: 2023,
      month: 11,
      day: 10,
    },
    datePassageAuGrade: {
      year: 2024,
      month: 11,
      day: 10,
    },
    avancement: Avancement.AVANCEMENT,
    informationCarrière: 'blablabla carrière',
    grade: Magistrat.Grade.I,
    currentPosition: 'Avocat général - service extraordinaire CC  PARIS',
    targettedPosition: 'Premier avocat général CC  PARIS - HH',
    rank: '(2 sur une liste de 2)',
    birthDate: {
      year: 1961,
      month: 11,
      day: 1,
    },
    biography: '- blablablablabla',
    observers: ['DEFAULT Observer'],

    ...moreContent,
    rules,
  },
});

const getLucienPierreRead = (
  rowNumber = 1,
  moreContent?: PartialDeep<
    Omit<
      NominationFileRead['content'],
      | 'dueDate'
      | 'birthDate'
      | 'datePriseDeFonctionPosteActuel'
      | 'datePassageAuGrade'
      | 'rules'
    >
  >,
  rules = getReadRules({
    [NominationFile.RuleGroup.STATUTORY]: {
      [NominationFile.StatutoryRule.MINISTER_CABINET]: true,
    },
  }),
): NominationFileRead => ({
  rowNumber,
  content: {
    folderNumber: 2,
    name: 'Lucien Pierre',
    formation: Magistrat.Formation.PARQUET,
    dueDate: null,
    transparency: Transparency.AUTOMNE_2024,
    reporters: ['LUC Loïc'],
    grade: Magistrat.Grade.HH,
    currentPosition: 'Procureur de la République adjoint TJ  NIMES',
    targettedPosition: 'Avocat général CC  PARIS - HH',
    rank: '2 sur une liste de 11)',
    birthDate: {
      year: 1962,
      month: 8,
      day: 22,
    },
    biography: '- blablablablabla',
    observers: null,
    datePriseDeFonctionPosteActuel: {
      year: 2023,
      month: 11,
      day: 10,
    },
    datePassageAuGrade: {
      year: 2020,
      month: 9,
      day: 10,
    },
    avancement: Avancement.EQUIVALENCE,
    informationCarrière: 'blablabla carrière pierre',

    ...moreContent,
    rules,
  },
});

export const getReadRules = (
  moreRules?: PartialDeep<NominationFileRead['content']['rules']>,
): NominationFileRead['content']['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(ManagementRule).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.MANAGEMENT]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(StatutoryRule).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.STATUTORY]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(QualitativeRule).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.QUALITATIVE]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});

export class NominationFileReadRulesBuilder extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor() {
    super(true, allRulesMapV1);
  }
}
