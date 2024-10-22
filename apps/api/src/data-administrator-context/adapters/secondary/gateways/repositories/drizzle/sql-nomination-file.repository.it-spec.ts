import { Magistrat, NominationFile, Transparency } from '@/shared-models';
import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { getAllRulesPreValidated } from 'src/data-administrator-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.spec';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { clearDB } from 'test/docker-postgresql-manager';
import { SqlNominationFileRepository } from './sql-nomination-file.repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/drizzleTransactionPerformer';
import { nominationFiles } from './schema/nomination-file-pm';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-config';

describe('SQL Nomination File Repository', () => {
  let db: DrizzleDb;
  let nominationFileRepository: NominationFileRepository;
  let transactionPerformer: TransactionPerformer;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    transactionPerformer = new DrizzleTransactionPerformer(db);
    nominationFileRepository = new SqlNominationFileRepository();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a nomination file', async () => {
    await transactionPerformer.perform(
      nominationFileRepository.save(aNominationFile),
    );

    const nominationFilesData = await db
      .select()
      .from(nominationFiles)
      .execute();

    expect(nominationFilesData).toEqual([
      SqlNominationFileRepository.mapToDb(aNominationFile),
    ]);
  });

  const nominationFileId = 'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';
  const aNominationFile = new NominationFileModel(nominationFileId, null, {
    rowNumber: 1,
    content: {
      name: 'Lucien Pierre',
      formation: Magistrat.Formation.PARQUET,
      dueDate: null,
      state: NominationFile.ReportState.OPINION_RETURNED,
      transparency: Transparency.AUTOMNE_2024,
      reporter: 'VICTOIRE Christian',
      grade: Magistrat.Grade.HH,
      currentPosition: 'Procureur de la République adjoint TJ  NIMES',
      targettedPosition: 'Avocat général CC  PARIS - HH',
      rank: '(2 sur une liste de 11)',
      birthDate: {
        year: 1962,
        month: 8,
        day: 22,
      },
      biography: '- blablablablabla',
      rules: getAllRulesPreValidated({ exceptRuleMinisterCabinet: true }),
    },
  });
});
