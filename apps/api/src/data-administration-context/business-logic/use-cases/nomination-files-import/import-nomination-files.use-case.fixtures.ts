import {
  Magistrat,
  NominationFile,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { PartialDeep } from 'type-fest';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { NominationFileRead } from '../../models/nomination-file-read';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from '../../models/rules';

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
    rowNumber: rowNumber,
    content: getMarcelDupontRead(rowNumber, moreContent, rules).content,
  });
export type GetMarcelDupontModelSnapshot = ReturnType<
  typeof getMarcelDupontModelSnapshotFactory
>;

export const getLucienPierreModelSnapshotFactory =
  (dateTimeProvider: DeterministicDateProvider) =>
  (uuid: string, rowNumber = 1): NominationFileModelSnapshot => ({
    id: uuid,
    createdAt: dateTimeProvider.currentDate,
    rowNumber: rowNumber,
    content: getLucienPierreRead(rowNumber).content,
  });
export type GetLucienPierreModelSnapshot = ReturnType<
  typeof getLucienPierreModelSnapshotFactory
>;

export const getMarcelDupontRead = (
  rowNumber = 1,
  moreContent?: PartialDeep<
    Omit<NominationFileRead['content'], 'dueDate' | 'birthDate' | 'rules'>
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

const getLucienPierreRead = (rowNumber = 1): NominationFileRead => ({
  rowNumber,
  content: {
    folderNumber: 2,
    name: 'Lucien Pierre',
    formation: Magistrat.Formation.PARQUET,
    dueDate: null,
    transparency: Transparency.AUTOMNE_2024,
    reporters: null,
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
    rules: getReadRules({
      [NominationFile.RuleGroup.STATUTORY]: {
        [NominationFile.StatutoryRule.MINISTER_CABINET]: true,
      },
    }),
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
