import { sql } from 'drizzle-orm';
import {
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
import { NominationFileModelSnapshot } from 'src/data-administration-context/business-logic/models/nomination-file';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import { reportStateEnum } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { BooleanReportRulesBuilder } from 'src/reports-context/business-logic/models/boolean-report-rules.builder';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { getDrizzleInstance } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

const gradeEnum = pgEnum(
  'grade',
  Object.values(Magistrat.Grade) as [Magistrat.Grade, ...Magistrat.Grade[]],
);

const transparencesPm = dataAdministrationContextSchema.table('transparences', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: transparencyEnum('name').unique().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  formation: formationEnum('formation').notNull(),
  nominationFiles: jsonb('nomination_files').array().notNull(),
});

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

const jean: typeof users.$inferInsert = {
  id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  firstName: 'jean',
  lastName: 'jean',
  email: 'jean@example.fr',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
  // Unencrypted password is 'password+00'
  password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
};
const luc: typeof users.$inferInsert = {
  id: '490558fb-67b8-4522-9dab-7dc82961e39a',
  firstName: 'luc',
  lastName: 'luc',
  email: 'luc@example.fr',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.F,
  // Unencrypted password is 'password+00'
  password: '$2b$10$ZsZ6Q01IdeksH/XkaZhzJuMLVCJC6TT2RbYkZ3oZDo85XkkOB5Ina',
};

type NominationFileReducedSnapshot = NominationFileModelSnapshot;
const nominationFile1: NominationFileReducedSnapshot = {
  id: '6d0bfb26-c355-46a3-99cd-fba6ae9b410e',
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
};
const nominationFile2: NominationFileReducedSnapshot = {
  id: '1f395754-0fe5-4429-a279-78872e4856e8',
  createdAt: new Date(2021, 1, 1),
  rowNumber: 2,
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
};
const nominationFile3: NominationFileReducedSnapshot = {
  id: '6b2d13cb-177e-4ff8-9d39-9a279c9323af',
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
};

const transparenceA = {
  id: 'a4894798-3cb7-4204-873d-dc6a66e2a22e',
  createdAt: new Date(),
  formation: Magistrat.Formation.SIEGE,
  name: Transparency.AUTOMNE_2024,
  nominationFiles: [nominationFile1, nominationFile2],
} satisfies typeof transparencesPm.$inferInsert;
const transparenceB = {
  id: 'b8009edf-0955-4600-8840-56e91f3c68de',
  createdAt: new Date(),
  formation: Magistrat.Formation.PARQUET,
  name: Transparency.DU_03_MARS_2025,
  nominationFiles: [nominationFile3],
} satisfies typeof transparencesPm.$inferInsert;

const jeanRapporteurId = '6029fde9-59b8-4e56-bb03-53f6293e259f';
const lucRapporteurId = 'ef148f78-d057-47d8-83d6-efbc10879d37';

const nominationFile1RapporteurJean = {
  id: '57f7df61-e095-4efb-910a-e51f6fa358b5',
  createdAt: new Date(),
  formation: Magistrat.Formation.SIEGE,
  nominationFileId: nominationFile1.id,
  reporterId: jeanRapporteurId,
  comment: 'rapport dossier 1 de jean',
  transparency: transparenceA.name,

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
  transparency: transparenceA.name,

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
  transparency: transparenceA.name,

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
  transparency: transparenceB.name,

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

  for (const num of Array.from({ length: 46 }, (_, i) => i + 1)) {
    const sql = getDrizzleMigrationSql(num);
    await db.execute(sql);
  }

  await db.insert(users).values([jean, luc]).execute();

  await db
    .insert(transparencesPm)
    .values([transparenceA, transparenceB])
    .execute();

  const allReports = [
    nominationFile1RapporteurJean,
    nominationFile1RapporteurLuc,
    nominationFile2RapporteurJean,
    nominationFile3RapporteurJean,
  ];

  await db.insert(prevReportsPm).values(allReports).execute();

  for (const report of allReports) {
    const report1RulesPromises = allRulesTuple.map(
      async ([ruleGroup, ruleName], i) => ({
        id: crypto.randomUUID(),
        createdAt: new Date(2021, 1, 1),
        reportId: report.id,
        ruleGroup,
        ruleName,
        validated: true,
        preValidated: i <= 1,
      }),
    );
    await Promise.all(report1RulesPromises);
  }
}

preMigration0047();
