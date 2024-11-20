import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { filesPm } from './schema';
import { SqlFileRepository } from './sql-file.repository';

describe('SQL Files Repository', () => {
  let filesRepository: SqlFileRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    filesRepository = new SqlFileRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a file', async () => {
    await transactionPerformer.perform(
      filesRepository.save(FileDocument.fromSnapshot(aFile)),
    );

    const existingFiless = await db.select().from(filesPm).execute();
    expect(existingFiless).toEqual([SqlFileRepository.mapSnapshotToDb(aFile)]);
  });
});

const aFile: FileDocumentSnapshot = {
  id: 'd86d9949-ad4c-4316-9e0e-b34e352045f8',
  createdAt: new Date(2026, 10, 10),
  name: 'file-name.txt',
  storageProvider: FilesStorageProvider.OUTSCALE,
  uri: 'https://example.fr/file-name.txt',
};
