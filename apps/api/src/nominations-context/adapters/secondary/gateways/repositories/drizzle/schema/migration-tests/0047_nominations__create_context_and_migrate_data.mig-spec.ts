import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
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
import { Pool } from 'pg';
import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { dataAdministrationContextSchema } from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema/nomination-file-schema.drizzle';
import { NominationFileModelSnapshot } from 'src/data-administration-context/business-logic/models/nomination-file';
import { AffectationsDossiersDeNominations } from 'src/nominations-context/business-logic/models/affectation';
import { TypeDeSaisine } from 'shared-models';
import {
  reportStateEnum,
  ruleGroupEnum,
  ruleNameEnum,
} from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { clearDB } from 'test/docker-postgresql-manager';
import { PickDeep } from 'type-fest';
import { nominationsContextSchema } from '../nominations-context-schema.drizzle';

const typeDeSaisineEnum = nominationsContextSchema.enum(
  'type_de_saisine',
  Object.values(TypeDeSaisine) as [TypeDeSaisine, ...TypeDeSaisine[]],
);

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
const sessionPm = nominationsContextSchema.table('session', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  formation: formationEnum('formation').notNull(),
  typeDeSaisine: typeDeSaisineEnum('type_de_saisine').notNull(),
  sessionImportId: text('session_import_id').notNull(),
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

const newReportsPm = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: uuid('reporter_id').notNull(),
  nominationFileId: uuid('nomination_file_id').notNull(),
  sessionId: uuid('session_id').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  state: reportStateEnum('state')
    .notNull()
    .default(NominationFile.ReportState.NEW),
  formation: formationEnum('formation').notNull(),
  comment: text('comment'),
  attachedFiles: jsonb('attached_files'),
});
const prevReportRulesPm = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: ruleNameEnum('rule_name').notNull(),
  preValidated: boolean('pre_validated').notNull(),
  validated: boolean('validated').notNull(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => prevReportsPm.id),
});

const newDossierDeNominationPm = nominationsContextSchema.table(
  'dossier_de_nomination',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sessionId: uuid('session_id').notNull(),
    dossierDeNominationImportéId: uuid(
      'dossier_de_nomination_import_id',
    ).notNull(),
    content: jsonb('content').notNull(),
  },
);
const newAffectationPm = nominationsContextSchema.table('affectation', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  sessionId: uuid('session_id').unique().notNull(),
  formation: formationEnum('formation').notNull(),
  affectationsDossiersDeNominations: jsonb(
    'affectations_dossiers_de_nominations',
  )
    .array()
    .notNull(),
});

type NominationFileReducedSnapshot = PickDeep<
  NominationFileModelSnapshot,
  | 'id'
  | 'rowNumber'
  | 'content.biography'
  | 'content.folderNumber'
  | 'content.formation'
>;
const nominationFile1: NominationFileReducedSnapshot = {
  id: '6d0bfb26-c355-46a3-99cd-fba6ae9b410e',
  rowNumber: 1,
  content: {
    folderNumber: 1,
    formation: Magistrat.Formation.SIEGE,
    biography: 'bio 1',
  },
};
const nominationFile2: NominationFileReducedSnapshot = {
  id: '1f395754-0fe5-4429-a279-78872e4856e8',
  rowNumber: 2,
  content: {
    folderNumber: 2,
    formation: Magistrat.Formation.PARQUET,
    biography: 'bio 2',
  },
};
const nominationFile3: NominationFileReducedSnapshot = {
  id: '6b2d13cb-177e-4ff8-9d39-9a279c9323af',
  rowNumber: 3,
  content: {
    folderNumber: 3,
    formation: Magistrat.Formation.PARQUET,
    biography: 'bio 3',
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
  dueDate: new Date('2025-01-01').toISOString(),
  folderNumber: 1,
  grade: Magistrat.Grade.HH,
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

  birthDate: new Date('1980-01-01').toISOString(),
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

const schema = {
  transparencesPm,
  prevReportsPm,
  prevReportRulesPm,

  transparencyEnum,
  formationEnum,
  ruleGroupEnum,
  ruleNameEnum,
  reportStateEnum,
  gradeEnum,
};

const migrationNumber = 47;

describe(`migration 00${migrationNumber}`, () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({
    client: pool,
    schema: schema,
    casing: 'snake_case',
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
  });

  afterEach(async () => {
    await clearDB(db as unknown as NodePgDatabase);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('crée les sessions', async () => {
    await givenSomeDataAdminTranspa();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectNouvellesSessions();
  });

  it('crée les dossiers de nominations', async () => {
    await givenSomeDataAdminTranspa();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectNouvellesNominations();
  });

  it('crée les rapports', async () => {
    await givenSomeDataAdminTranspa();
    await givenSomeReports();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectNouveauxRapports();
  });

  it('crée les affectations', async () => {
    await givenSomeDataAdminTranspa();
    await givenSomeReports();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectNouvellesAffectations();
  });

  const givenSomeDataAdminTranspa = async () => {
    for (const transpa of [transparenceA, transparenceB]) {
      await db.insert(transparencesPm).values(transpa).execute();
    }
  };

  const givenSomeReports = async () => {
    for (const report of [
      nominationFile1RapporteurJean,
      nominationFile1RapporteurLuc,
      nominationFile2RapporteurJean,
      nominationFile3RapporteurJean,
    ]) {
      await db.insert(prevReportsPm).values(report).execute();
    }
  };

  const expectNouvellesSessions = async () => {
    expect(
      await db.select().from(sessionPm).orderBy(sessionPm.name).execute(),
    ).toEqual<(typeof sessionPm.$inferSelect)[]>([
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: transparenceA.name,
        formation: transparenceA.formation,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        sessionImportId: transparenceA.id,
        version: 1,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: transparenceB.name,
        formation: transparenceB.formation,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        sessionImportId: transparenceB.id,
        version: 1,
      },
    ]);
  };

  const expectNouvellesNominations = async () => {
    expect(await db.select().from(newDossierDeNominationPm).execute()).toEqual<
      (typeof newDossierDeNominationPm.$inferSelect)[]
    >([
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        sessionId: expect.any(String),
        dossierDeNominationImportéId: nominationFile1.id,
        content: nominationFile1.content,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        sessionId: expect.any(String),
        dossierDeNominationImportéId: nominationFile2.id,
        content: nominationFile2.content,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        sessionId: expect.any(String),
        dossierDeNominationImportéId: nominationFile3.id,
        content: nominationFile3.content,
      },
    ]);
  };

  const expectNouveauxRapports = async () => {
    expect(
      await db
        .select()
        .from(newReportsPm)
        .orderBy(newReportsPm.createdAt)
        .execute(),
    ).toEqual<(typeof newReportsPm.$inferSelect)[]>([
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        nominationFileId: expect.any(String),
        sessionId: expect.any(String),
        reporterId: jeanRapporteurId,
        version: 1,
        state: nominationFile1RapporteurJean.state,
        formation: nominationFile1.content.formation,
        comment: nominationFile1RapporteurJean.comment,
        attachedFiles: nominationFile1RapporteurJean.attachedFiles,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        nominationFileId: expect.any(String),
        sessionId: expect.any(String),
        reporterId: lucRapporteurId,
        version: 1,
        state: nominationFile1RapporteurLuc.state,
        formation: nominationFile1.content.formation,
        comment: nominationFile1RapporteurLuc.comment,
        attachedFiles: nominationFile1RapporteurLuc.attachedFiles,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        nominationFileId: expect.any(String),
        sessionId: expect.any(String),
        reporterId: jeanRapporteurId,
        version: 1,
        state: nominationFile2RapporteurJean.state,
        formation: nominationFile2.content.formation,
        comment: nominationFile2RapporteurJean.comment,
        attachedFiles: nominationFile2RapporteurJean.attachedFiles,
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        nominationFileId: expect.any(String),
        sessionId: expect.any(String),
        reporterId: jeanRapporteurId,
        version: 1,
        state: nominationFile3RapporteurJean.state,
        formation: nominationFile3.content.formation,
        comment: nominationFile3RapporteurJean.comment,
        attachedFiles: nominationFile3RapporteurJean.attachedFiles,
      },
    ]);
  };

  const expectNouvellesAffectations = async () => {
    expect(
      await db
        .select()
        .from(newAffectationPm)
        .orderBy(newAffectationPm.createdAt)
        .execute(),
    ).toEqual<
      (typeof newAffectationPm.$inferSelect & {
        affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
      })[]
    >([
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        sessionId: expect.any(String),
        formation: transparenceA.formation,
        affectationsDossiersDeNominations: [
          {
            dossierDeNominationId: expect.any(String),
            rapporteurIds: [
              nominationFile1RapporteurJean.reporterId,
              nominationFile1RapporteurLuc.reporterId,
            ],
          },
          {
            dossierDeNominationId: expect.any(String),
            rapporteurIds: [nominationFile2RapporteurJean.reporterId],
          },
        ],
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        sessionId: expect.any(String),
        formation: transparenceB.formation,
        affectationsDossiersDeNominations: [
          {
            dossierDeNominationId: expect.any(String),
            rapporteurIds: [nominationFile3RapporteurJean.reporterId],
          },
        ],
      },
    ]);
  };
});
