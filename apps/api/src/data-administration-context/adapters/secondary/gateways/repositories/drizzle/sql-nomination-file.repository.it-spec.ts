import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { NominationFileRepository } from 'src/data-administration-context/business-logic/gateways/repositories/nomination-file-repository';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from 'src/data-administration-context/business-logic/models/nomination-file';
import { getReadRules } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.spec';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { clearDB } from 'test/docker-postgresql-manager';
import { nominationFiles } from './schema/nomination-file-pm';
import { SqlNominationFileRepository } from './sql-nomination-file.repository';

describe('SQL Nomination File Repository', () => {
  let db: DrizzleDb;
  let nominationFileRepository: NominationFileRepository;
  let transactionPerformer: TransactionPerformer;
  let datetimeProvider: DeterministicDateProvider;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    transactionPerformer = new DrizzleTransactionPerformer(db);
    nominationFileRepository = new SqlNominationFileRepository();
    datetimeProvider = new DeterministicDateProvider();
    datetimeProvider.currentDate = new Date(2021, 8, 22);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a nomination file', async () => {
    const aNominationFile = givenSomeNominationFile();
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

  describe("when there's already a nomination file", () => {
    let aNominationFile: NominationFileModel;
    let aNominationFileSnapshot: NominationFileModelSnapshot;

    beforeEach(async () => {
      aNominationFile = givenSomeNominationFile();
      aNominationFileSnapshot = aNominationFile.toSnapshot();
      await db.insert(nominationFiles).values({
        id: aNominationFileSnapshot.id,
        createdAt: aNominationFileSnapshot.createdAt,
        rowNumber: aNominationFileSnapshot.rowNumber,
        content: aNominationFileSnapshot.content,
      });
    });

    it('finds all nomination files', async () => {
      const nominationFiles = await transactionPerformer.perform(
        nominationFileRepository.findAll(),
      );
      expect(nominationFiles).toEqual([aNominationFile]);
    });
  });

  const givenSomeNominationFile = () =>
    new NominationFileModel(
      'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b',
      datetimeProvider.currentDate,
      {
        rowNumber: 1,
        content: {
          folderNumber: 2,
          name: 'Lucien Pierre',
          formation: Magistrat.Formation.PARQUET,
          dueDate: null,
          state: NominationFile.ReportState.OPINION_RETURNED,
          transparency: Transparency.AUTOMNE_2024,
          reporters: ['VICTOIRE Christian'],
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
          observers: ['Some observer'],
          rules: getReadRules({
            [NominationFile.RuleGroup.STATUTORY]: {
              [NominationFile.StatutoryRule.MINISTER_CABINET]: false,
            },
          }),
        },
      },
    );
});
