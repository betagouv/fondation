import { FileModel } from 'src/identity-and-access-context/business-logic/models/file';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { files } from './schema/file-pm';
import { SqlFileRepository } from './sql-file.repository';
import { FileType } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';

const aFile = new FileModel(
  'a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a9b8c7d',
  FileType.PIECE_JOINTE_TRANSPARENCE,
);
const nonExistentFileId = 'dac7a3b1-dffb-44c4-a0e7-7e67bc46d61e';

describe('SQL File Repository', () => {
  let sqlFileRepository: SqlFileRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlFileRepository = new SqlFileRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('when there are files', () => {
    beforeEach(async () => {
      const fileRow = SqlFileRepository.mapToDb(aFile);
      await db.insert(files).values(fileRow).execute();
    });

    it.each`
      description                         | fileId               | expectedFile
      ${'finds a file by ID'}             | ${aFile.fileId}      | ${aFile}
      ${'returns nothing if no ID match'} | ${nonExistentFileId} | ${null}
    `('$description', async ({ fileId, expectedFile }) => {
      expect(
        await transactionPerformer.perform(
          sqlFileRepository.fileWithId(fileId),
        ),
      ).toEqual(expectedFile);
    });
  });
});
