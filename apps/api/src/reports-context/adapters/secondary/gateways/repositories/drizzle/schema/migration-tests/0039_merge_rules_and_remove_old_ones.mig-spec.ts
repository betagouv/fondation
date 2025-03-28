import { pushSchema } from 'drizzle-kit/api';
import { desc, sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { boolean, pgEnum, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';

enum RuleGroup {
  MANAGEMENT = 'management',
  STATUTORY = 'statutory',
  QUALITATIVE = 'qualitative',
}

enum ManagementRule {
  TRANSFER_TIME = 'TRANSFER_TIME',
  GETTING_FIRST_GRADE = 'GETTING_FIRST_GRADE',
  GETTING_GRADE_HH = 'GETTING_GRADE_HH',
  GETTING_GRADE_IN_PLACE = 'GETTING_GRADE_IN_PLACE',
  PROFILED_POSITION = 'PROFILED_POSITION',
  CASSATION_COURT_NOMINATION = 'CASSATION_COURT_NOMINATION',
  OVERSEAS_TO_OVERSEAS = 'OVERSEAS_TO_OVERSEAS',
  JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
  JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT = 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
}
enum StatutoryRule {
  JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION = 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION',
  GRADE_ON_SITE_AFTER_7_YEARS = 'GRADE_ON_SITE_AFTER_7_YEARS',
  MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS = 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS',
  MINISTER_CABINET = 'MINISTER_CABINET',
  GRADE_REGISTRATION = 'GRADE_REGISTRATION',
  HH_WITHOUT_2_FIRST_GRADE_POSITIONS = 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS',
  LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO = 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO',
}
enum QualitativeRule {
  CONFLICT_OF_INTEREST_PRE_MAGISTRATURE = 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE',
  CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION = 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION',
  EVALUATIONS = 'EVALUATIONS',
  DISCIPLINARY_ELEMENTS = 'DISCIPLINARY_ELEMENTS',
  HH_NOMINATION_CONDITIONS = 'HH_NOMINATION_CONDITIONS',
}

export type RuleName = ManagementRule | StatutoryRule | QualitativeRule;

export const ruleGroupEnum = pgEnum(
  'rule_group',
  Object.values(RuleGroup) as [RuleGroup, ...RuleGroup[]],
);

const ruleNames = [
  ...Object.values(ManagementRule),
  ...Object.values(StatutoryRule),
  ...Object.values(QualitativeRule),
] as [RuleName, ...RuleName[]];
export const oldRuleNameEnum = pgEnum('rule_name', ruleNames);
export const newRuleNameEnum = pgEnum('rule_name', [
  'TRANSFER_TIME',
  'GETTING_GRADE_IN_PLACE',
  'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
  ...Object.values(StatutoryRule),
  'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE',
  'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION',
  'EVALUATIONS',
  'DISCIPLINARY_ELEMENTS',
] as [RuleName, ...RuleName[]]);

const oldReportRulesPm = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: oldRuleNameEnum('rule_name').notNull(),
  preValidated: boolean('pre_validated').notNull(),
  validated: boolean('validated').notNull(),
  comment: text('comment'),
  reportId: uuid('report_id').notNull(),
});

const newReportRulesPm = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: oldRuleNameEnum('rule_name').notNull(),
  preValidated: boolean('pre_validated').notNull(),
  validated: boolean('validated').notNull(),
  reportId: uuid('report_id').notNull(),
});

const reportId = 'd76460fe-4013-4a63-a9df-1c4f99fc498d';

const createdAt = new Date();

const schema = {
  oldReportRulesPm,
  ruleGroupEnum,
  oldRuleNameEnum,
};

const migrationNumber = 39;

describe(`Reports context - migration 00${migrationNumber}`, () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({
    client: pool,
    schema,
    casing: 'snake_case',
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
  });

  afterEach(async () => {
    await db.execute(sql`DROP SCHEMA reports_context CASCADE`);
    await db.execute(sql`CREATE SCHEMA reports_context`);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it.each`
    ruleName
    ${ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE}
    ${ManagementRule.CASSATION_COURT_NOMINATION}
    ${ManagementRule.GETTING_FIRST_GRADE}
    ${ManagementRule.GETTING_GRADE_HH}
    ${ManagementRule.PROFILED_POSITION}
    ${ManagementRule.OVERSEAS_TO_OVERSEAS}
    ${ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE}
    ${'HH_NOMINATION_CONDITIONS'}
  `('removes old rules', async ({ ruleName }) => {
    await givenSomeReportRules({
      id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
      ruleName,
      preValidated: false,
      validated: false,
    });

    await db.execute(getDrizzleMigrationSql(migrationNumber));

    await expectReportRules();
  });

  it.each`
    sameRessortValidated | degreeChangeValidated | expectedValidated
    ${true}              | ${true}               | ${true}
    ${true}              | ${false}              | ${false}
    ${false}             | ${true}               | ${false}
    ${false}             | ${false}              | ${false}
  `(
    'merges JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE rule into JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
    async ({
      sameRessortValidated,
      degreeChangeValidated,
      expectedValidated,
    }) => {
      await givenSomeReportRules(
        {
          id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
          ruleName: ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
          preValidated: false,
          validated: sameRessortValidated,
        },
        {
          id: '53492bf1-b48c-4960-a171-87a57657079a',
          ruleName: ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
          preValidated: false,
          validated: degreeChangeValidated,
        },
      );

      await db.execute(getDrizzleMigrationSql(migrationNumber));

      await expectReportRules({
        id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
        preValidated: false,
        validated: expectedValidated,
        ruleName: ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
      });
    },
  );

  it.each`
    sameRessortPreValidated | degreeChangePreValidated | expectedPreValidated
    ${true}                 | ${true}                  | ${true}
    ${true}                 | ${false}                 | ${true}
    ${false}                | ${true}                  | ${true}
    ${false}                | ${false}                 | ${false}
  `(
    'merges JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE rule into JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
    async ({
      sameRessortPreValidated,
      degreeChangePreValidated,
      expectedPreValidated,
    }) => {
      await givenSomeReportRules(
        {
          id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
          ruleName: ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
          preValidated: sameRessortPreValidated,
          validated: false,
        },
        {
          id: '53492bf1-b48c-4960-a171-87a57657079a',
          ruleName: ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
          preValidated: degreeChangePreValidated,
          validated: false,
        },
      );

      await db.execute(getDrizzleMigrationSql(migrationNumber));

      await expectReportRules({
        id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
        preValidated: expectedPreValidated,
        validated: false,
        ruleName: ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
      });
    },
  );

  const givenSomeReportRules = async (
    ...someReportRules: Pick<
      Required<typeof oldReportRulesPm.$inferInsert>,
      'id' | 'preValidated' | 'validated' | 'ruleName'
    >[]
  ) => {
    await db
      .insert(oldReportRulesPm)
      .values(
        someReportRules.map((r) => ({
          id: r.id,
          createdAt,
          ruleGroup: RuleGroup.MANAGEMENT,
          ruleName: r.ruleName,
          preValidated: r.preValidated,
          validated: r.validated,
          comment: null,
          reportId,
        })),
      )
      .execute();
  };

  const expectReportRules = async (
    ...expectedReportRules: Pick<
      Required<typeof oldReportRulesPm.$inferSelect>,
      'id' | 'preValidated' | 'validated' | 'ruleName'
    >[]
  ) => {
    expect(
      await db
        .select()
        .from(newReportRulesPm)
        .orderBy(
          desc(newReportRulesPm.ruleGroup),
          desc(newReportRulesPm.ruleName),
        )
        .execute(),
    ).toEqual<(typeof newReportRulesPm.$inferSelect)[]>(
      expectedReportRules.map((r) => ({
        id: r.id,
        preValidated: r.preValidated,
        ruleGroup: RuleGroup.MANAGEMENT,
        validated: r.validated,
        ruleName: r.ruleName,
        createdAt,
        reportId,
      })),
    );
  };
});
