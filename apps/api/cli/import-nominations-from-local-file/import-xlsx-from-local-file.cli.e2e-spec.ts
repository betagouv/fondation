import { NestApplication } from '@nestjs/core';
import { uneTransparenceSiege } from 'cli/import-nominations-from-local-file/import-xlsx-from-local-file.fixtures';
import path from 'node:path';
import { Gender, Role } from 'shared-models';
import { ImportXlsxFileFromLocalFileCli } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/import-xlsx-from-local-file.cli';
import { IMPORT_XLSX_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/tokens';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { reportersMap } from './import-nominations-from-local-file.fixtures';

const xlsxPath = path.resolve(
  __dirname,
  './TransparenceAnnuelle_Siege_T21032025.xlsx',
);

describe('Import Xlsx from local file', () => {
  let app: NestApplication;
  let db: DrizzleDb;
  let importXlsxFileFromLocalFileCli: ImportXlsxFileFromLocalFileCli;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await new BaseAppTestingModule(db).compile();
    app = moduleFixture.createNestApplication();

    await app.init();
    await app.listen(defaultApiConfig.port);

    importXlsxFileFromLocalFileCli = app.get<ImportXlsxFileFromLocalFileCli>(
      IMPORT_XLSX_FILE_FROM_LOCAL_FILE_CLI,
    );

    await db.insert(users).values([
      {
        id: reportersMap['ROUSSIN Jules'],
        lastName: 'roussin',
        firstName: 'jules',
        email: 'jules.roussin@example.fr',
        password: 'some-password',
        role: Role.MEMBRE_DU_PARQUET,
        gender: Gender.M,
      },
      {
        id: reportersMap['JOSSELIN-MARTEL Martin-Luc'],
        firstName: 'martin-luc',
        lastName: 'josselin-martel',
        email: 'martin-luc@example.fr',
        password: 'some-password',
        role: Role.MEMBRE_DU_SIEGE,
        gender: Gender.M,
      },
    ]);
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  // Test à utiliser pour valider l'import d'une transparence au format
  // xlsx et cibler rapidement les erreurs qu'elle peut contenir.
  it.skip('importe une transparence siège', async () => {
    const {
      formation,
      nomTransparence,
      dateTransparence,
      dateEcheance,
      datePriseDePosteCible,
      dateClotureDelaiObservation,
    } = uneTransparenceSiege;

    await importXlsxFileFromLocalFileCli.execute(
      xlsxPath,
      formation,
      nomTransparence,
      DateOnly.fromString(dateTransparence, 'yyyy-MM-dd').toJson(),
      DateOnly.fromString(dateEcheance as string, 'yyyy-MM-dd').toJson(),
      datePriseDePosteCible
        ? DateOnly.fromString(datePriseDePosteCible, 'yyyy-MM-dd').toJson()
        : null,
      DateOnly.fromString(
        dateClotureDelaiObservation as string,
        'yyyy-MM-dd',
      ).toJson(),
    );
  });
});
