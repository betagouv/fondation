import {
  allRulesMap,
  Magistrat,
  Month,
  NominationFile,
  Transparency,
} from 'shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { z, ZodBoolean, ZodObject, ZodType } from 'zod';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    folderNumber: number | null;
    name: string;
    formation: Magistrat.Formation;
    dueDate: DateOnlyJson | null;
    state:
      | NominationFile.ReportState.NEW
      | NominationFile.ReportState.SUPPORTED;
    transparency: Transparency;
    reporters: string[] | null;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    birthDate: DateOnlyJson;
    biography: string | null;
    observers: string[] | null;
    rules: {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [key in NominationFile.ManagementRule]: boolean;
      };
      [NominationFile.RuleGroup.STATUTORY]: {
        [key in NominationFile.StatutoryRule]: boolean;
      };
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [key in NominationFile.QualitativeRule]: boolean;
      };
    };
  };
};

export type Rules = {
  [NominationFile.RuleGroup.MANAGEMENT]: ZodObject<
    Record<NominationFile.ManagementRule, ZodBoolean>
  >;
  [NominationFile.RuleGroup.STATUTORY]: ZodObject<
    Record<NominationFile.StatutoryRule, ZodBoolean>
  >;
  [NominationFile.RuleGroup.QUALITATIVE]: ZodObject<
    Record<NominationFile.QualitativeRule, ZodBoolean>
  >;
};

const createZodGroupRules = () => {
  return z.object(
    Object.values(NominationFile.RuleGroup).reduce(
      (acc, group) => ({
        ...acc,
        [group]: z.object(
          Object.fromEntries(
            allRulesMap[group].map((ruleName) => [ruleName, z.boolean()]),
          ),
        ),
      }),
      {} as Rules,
    ),
  );
};

export const nominationFileReadContentSchema = z.object({
  folderNumber: z.number().nullable(),
  name: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
  dueDate: z
    .object({
      year: z.number(),
      month: z.number().min(1).max(12) as ZodType<Month>,
      day: z.number(),
    })
    .nullable(),
  state: z.enum([
    NominationFile.ReportState.NEW,
    NominationFile.ReportState.SUPPORTED,
  ]),
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
  rules: createZodGroupRules(),
}) satisfies ZodType<NominationFileRead['content']>;

export const nominationFileReadSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema,
}) satisfies ZodType<NominationFileRead>;

export const nominationFileReadListSchema =
  nominationFileReadSchema.array() satisfies ZodType<NominationFileRead[]>;
