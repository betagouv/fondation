import { Magistrat, Month, NominationFile, Transparency } from 'shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { z, ZodBoolean, ZodObject, ZodType } from 'zod';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from './rules';
import { Avancement } from './avancement';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    folderNumber: number | null;
    name: string;
    formation: Magistrat.Formation;
    dueDate: DateOnlyJson | null;
    transparency: Transparency;
    reporters: string[] | null;
    datePriseDeFonctionPosteActuel: DateOnlyJson;
    datePassageAuGrade: DateOnlyJson | null;
    avancement: Avancement;
    informationCarrière: string | null;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    birthDate: DateOnlyJson;
    biography: string | null;
    observers: string[] | null;
    rules: {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [key in ManagementRule]: boolean;
      };
      [NominationFile.RuleGroup.STATUTORY]: {
        [key in StatutoryRule]: boolean;
      };
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [key in QualitativeRule]: boolean;
      };
    };
  };
};

export type Rules = {
  [NominationFile.RuleGroup.MANAGEMENT]: ZodObject<
    Record<ManagementRule, ZodBoolean>
  >;
  [NominationFile.RuleGroup.STATUTORY]: ZodObject<
    Record<StatutoryRule, ZodBoolean>
  >;
  [NominationFile.RuleGroup.QUALITATIVE]: ZodObject<
    Record<QualitativeRule, ZodBoolean>
  >;
};

export type PartialRules = Partial<{
  [NominationFile.RuleGroup.MANAGEMENT]: ZodObject<{
    [K in ManagementRule]?: ZodBoolean | undefined;
  }>;
  [NominationFile.RuleGroup.STATUTORY]: ZodObject<{
    [K in StatutoryRule]?: ZodBoolean;
  }>;
  [NominationFile.RuleGroup.QUALITATIVE]: ZodObject<{
    [K in QualitativeRule]?: ZodBoolean;
  }>;
}>;

const zodGroupRules = z.object(
  Object.values(NominationFile.RuleGroup).reduce(
    (acc, group) => ({
      ...acc,
      [group]: z.object(
        Object.fromEntries(
          allRulesMapV1[group].map((ruleName) => [ruleName, z.boolean()]),
        ),
      ),
    }),
    {} as Rules,
  ),
);

const createGroupRulesPartial = (group: NominationFile.RuleGroup) =>
  z
    .object(
      Object.fromEntries(
        allRulesMapV1[group].map((ruleName) => [ruleName, z.boolean()]),
      ),
    )
    .partial();
export const zodGroupRulesPartial = z
  .object({
    [NominationFile.RuleGroup.MANAGEMENT]: createGroupRulesPartial(
      NominationFile.RuleGroup.MANAGEMENT,
    ),
    [NominationFile.RuleGroup.STATUTORY]: createGroupRulesPartial(
      NominationFile.RuleGroup.STATUTORY,
    ),
    [NominationFile.RuleGroup.QUALITATIVE]: createGroupRulesPartial(
      NominationFile.RuleGroup.QUALITATIVE,
    ),
  })
  .partial();

const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12) as ZodType<Month>,
  day: z.number(),
});
export const nominationFileReadContentSchema = z.object({
  folderNumber: z.number().nullable(),
  name: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
  dueDate: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema,
  datePassageAuGrade: dateOnlyJsonSchema,
  avancement: z.nativeEnum(Avancement),
  informationCarrière: z.string().nullable(),
  transparency: z.nativeEnum(Transparency),
  reporters: z.array(z.string()).nullable(),
  grade: z.nativeEnum(Magistrat.Grade),
  currentPosition: z.string(),
  targettedPosition: z.string(),
  rank: z.string(),
  birthDate: z.object({
    year: z.number(),
    month: z.number().min(1).max(12) as ZodType<Month>,
    day: z.number(),
  }),
  biography: z.string().nullable(),
  observers: z.array(z.string()).nullable(),
  rules: zodGroupRules,
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
