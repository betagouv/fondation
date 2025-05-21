import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  allRulesTuple,
  Gender,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
} from 'shared-models';
import { dataAdministrationContextSchema } from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema/nomination-file-schema.drizzle';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import {
  reportStateEnum,
  ruleGroupEnum,
  ruleNameEnum,
} from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { BooleanReportRulesBuilder } from 'src/reports-context/business-logic/models/boolean-report-rules.builder';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { getDrizzleInstance } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

const transpaA = Transparency.AUTOMNE_2024;
const transpaB = Transparency.DU_03_MARS_2025;

const gradeEnum = pgEnum(
  'grade',
  Object.values(Magistrat.Grade) as [Magistrat.Grade, ...Magistrat.Grade[]],
);

const nominationFilesPm = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    rowNumber: integer('row_number').notNull(),
    content: jsonb('content').notNull(),
  },
);
const nominationFile1 = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  createdAt: new Date(2020, 1, 1),
  rowNumber: 1,
  content: {
    folderNumber: 1,
    formation: Magistrat.Formation.SIEGE,
    biography: 'bio 1',
    birthDate: {
      day: 1,
      month: 1,
      year: 1980,
    },
    currentPosition: 'current position 1',
    dueDate: {
      day: 1,
      month: 1,
      year: 2025,
    },
    grade: Magistrat.Grade.HH,
    name: 'Jean Dupont',
    rank: 'rank 1',
    targettedPosition: 'targetted position 1',
    observers: ['Jean Luc'],
    transparency: Transparency.AUTOMNE_2024,
    reporters: [],
    rules: new BooleanReportRulesBuilder().build(),
  },
} satisfies typeof nominationFilesPm.$inferInsert;

const nominationFile2 = {
  id: 'e8e84c9f-7b2c-46a5-b47f-e1c6e9b80120',
  createdAt: new Date(2021, 1, 1),
  rowNumber: 3,
  content: {
    folderNumber: 2,
    formation: Magistrat.Formation.PARQUET,
    biography: 'bio 2',
    birthDate: {
      day: 1,
      month: 1,
      year: 1980,
    },
    currentPosition: 'current position 1',
    dueDate: {
      day: 2,
      month: 1,
      year: 2026,
    },
    grade: Magistrat.Grade.I,
    name: 'Jean Aubry',
    rank: 'rank 2',
    targettedPosition: 'targetted position 2',
    observers: ['Jean Luc 2'],
    transparency: Transparency.AUTOMNE_2024,
    reporters: [],
    rules: new BooleanReportRulesBuilder(false).build(),
  },
} satisfies typeof nominationFilesPm.$inferInsert;

const nominationFile3 = {
  id: '258e2a60-a6aa-4a25-b4f2-e4a9194dd980',
  createdAt: new Date(2022, 1, 1),
  rowNumber: 3,
  content: {
    folderNumber: 3,
    formation: Magistrat.Formation.PARQUET,
    biography: 'bio 3',

    birthDate: {
      day: 1,
      month: 1,
      year: 1990,
    },
    currentPosition: 'current position 1',
    dueDate: {
      day: 1,
      month: 1,
      year: 2025,
    },
    grade: Magistrat.Grade.HH,
    name: 'Jean Dupont 3',
    rank: 'rank 3',
    targettedPosition: 'targetted position 3',
    observers: ['Jean Luc 3'],
    transparency: Transparency.DU_03_MARS_2025,
    reporters: [],
    rules: new BooleanReportRulesBuilder(false).build(),
  },
} satisfies typeof nominationFilesPm.$inferInsert;

const prevReportsPm = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: uuid('reporter_id').notNull(),
  nominationFileId: uuid('nomination_file_id').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  folderNumber: integer('folder_number'),
  biography: text('biography'),
  dueDate: date('due_date'),
  name: varchar('name').notNull(),
  birthDate: date('birth_date').notNull(),
  state: reportStateEnum('state')
    .notNull()
    .default(NominationFile.ReportState.NEW),
  formation: formationEnum('formation').notNull(),
  transparency: transparencyEnum('transparency').notNull(),
  grade: gradeEnum('grade').notNull(),
  currentPosition: varchar('current_position').notNull(),
  targettedPosition: varchar('targetted_position').notNull(),
  comment: text('comment'),
  rank: varchar('rank').notNull(),
  observers: text().array(),
  attachedFiles: jsonb('attached_files'),
});

const reportRulesPm = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: ruleNameEnum('rule_name').notNull(),
  validated: boolean('validated').notNull(),
  preValidated: boolean('pre_validated').notNull(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => prevReportsPm.id),
});

const jeanRapporteurId = '6029fde9-59b8-4e56-bb03-53f6293e259f';
const lucRapporteurId = 'ef148f78-d057-47d8-83d6-efbc10879d37';
const jean: typeof users.$inferInsert = {
  id: jeanRapporteurId,
  firstName: 'jean',
  lastName: 'jean',
  email: 'jean@example.fr',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
  // Unencrypted password is 'password+00'
  password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
};
const luc: typeof users.$inferInsert = {
  id: lucRapporteurId,
  firstName: 'luc',
  lastName: 'luc',
  email: 'luc@example.fr',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.F,
  // Unencrypted password is 'password+00'
  password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
};

const nominationFile1RapporteurJean = {
  id: '57f7df61-e095-4efb-910a-e51f6fa358b5',
  createdAt: new Date(),
  formation: Magistrat.Formation.SIEGE,
  nominationFileId: nominationFile1.id,
  reporterId: jeanRapporteurId,
  comment: 'rapport dossier 1 de jean',
  transparency: transpaA,

  birthDate: new Date('1980-01-01').toISOString(),
  currentPosition: 'current position 1',
  dueDate: new Date('2025-01-01').toISOString(),
  folderNumber: 1,
  grade: Magistrat.Grade.HH,
  name: 'Jean Dupont',
  rank: 'rank 1',
  state: NominationFile.ReportState.NEW,
  targettedPosition: 'targetted position 1',
  observers: ['Jean', 'Luc'],
  attachedFiles: null,
} satisfies typeof prevReportsPm.$inferInsert;
const nominationFile1RapporteurLuc = {
  id: 'a1e7d5f6-1e1f-4312-a9af-ea0bdd6bb716',
  createdAt: new Date(),
  formation: Magistrat.Formation.SIEGE,
  nominationFileId: nominationFile1.id,
  reporterId: lucRapporteurId,
  comment: 'rapport dossier 1 de luc',
  transparency: transpaA,

  birthDate: new Date('1980-01-01').toISOString(),
  currentPosition: 'current position 1',
  dueDate: new Date('2025-01-01').toISOString(),
  folderNumber: 1,
  grade: Magistrat.Grade.HH,
  name: 'Jean Dupont',
  rank: 'rank 1',
  state: NominationFile.ReportState.NEW,
  targettedPosition: 'targetted position 1',
  observers: ['Jean', 'Luc'],
  attachedFiles: null,
} satisfies typeof prevReportsPm.$inferInsert;
const nominationFile2RapporteurJean = {
  id: '7220f137-1792-413b-ae3e-0a2d7deab74c',
  createdAt: new Date(),
  formation: Magistrat.Formation.PARQUET,
  nominationFileId: nominationFile2.id,
  reporterId: jeanRapporteurId,
  comment: 'rapport dossier 2 de jean',
  transparency: transpaA,

  birthDate: new Date('1980-01-01').toISOString(),
  currentPosition: 'current position 1',
  dueDate: new Date('2026-01-02').toISOString(),
  folderNumber: 1,
  grade: Magistrat.Grade.I,
  name: 'Jean Aubry',
  rank: 'rank 2',
  state: NominationFile.ReportState.IN_PROGRESS,
  targettedPosition: 'targetted position 2',
  observers: ['Jean', 'Luc 2'],
  attachedFiles: null,
} satisfies typeof prevReportsPm.$inferInsert;
const nominationFile3RapporteurJean = {
  id: '38ec1129-e77b-4169-8b5a-4a7a5bc7f7f1',
  createdAt: new Date(),
  formation: Magistrat.Formation.PARQUET,
  nominationFileId: nominationFile3.id,
  reporterId: jeanRapporteurId,
  comment: 'rapport dossier 3 de jean',
  transparency: transpaB,

  birthDate: new Date('1990-01-01').toISOString(),
  currentPosition: 'current position 1',
  dueDate: new Date('2025-01-01').toISOString(),
  folderNumber: 1,
  grade: Magistrat.Grade.HH,
  name: 'Jean Dupont 3',
  rank: 'rank 3',
  state: NominationFile.ReportState.NEW,
  targettedPosition: 'targetted position 3',
  observers: ['Jean', 'Luc 3'],
  attachedFiles: null,
} satisfies typeof prevReportsPm.$inferInsert;

export default async function preMigration0047() {
  const db = getDrizzleInstance(defaultApiConfig.database);

  // for (const num of Array.from({ length: 46 }, (_, i) => i + 1)) {
  //   const sql = getDrizzleMigrationSql(num);
  //   await db.execute(sql);
  // }

  await db.insert(users).values([jean, luc]).execute();

  await db
    .insert(nominationFilesPm)
    .values([nominationFile1, nominationFile2, nominationFile3])
    .execute();

  const allReports = [
    nominationFile1RapporteurJean,
    nominationFile1RapporteurLuc,
    nominationFile2RapporteurJean,
    nominationFile3RapporteurJean,
  ];

  await db.insert(prevReportsPm).values(allReports).execute();

  for (const report of allReports) {
    const allRules = allRulesTuple.map(([ruleGroup, ruleName], i) => ({
      createdAt: new Date(2021, 1, 1),
      reportId: report.id,
      ruleGroup,
      ruleName,
      validated: i <= 1,
      preValidated: i <= 1,
    }));
    await db.insert(reportRulesPm).values(allRules).execute();
  }
}

preMigration0047();
