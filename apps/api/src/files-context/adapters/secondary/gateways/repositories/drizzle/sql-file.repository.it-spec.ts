import { FileDocumentBuilder } from 'src/files-context/business-logic/builders/file-document.builder';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
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

  describe('when there is already one file', () => {
    beforeEach(async () => {
      await givenSomeFiles(aFile, anotherFile);
    });

    it('gets files by ids', async () => {
      const files = await transactionPerformer.perform(
        filesRepository.getByNames([aFile.name, anotherFile.name]),
      );
      expect(files).toEqual<FileDocument[]>(
        [aFile, anotherFile].map(FileDocument.fromSnapshot),
      );
    });
  });

  const givenSomeFiles = async (...files: FileDocumentSnapshot[]) =>
    db
      .insert(filesPm)
      .values(files.map(SqlFileRepository.mapSnapshotToDb))
      .execute();
});

const aFile = new FileDocumentBuilder()
  .with('id', 'd86d9949-ad4c-4316-9e0e-b34e352045f8')
  .with('name', 'file-name.txt')
  .with('path', ['main-folder', 'sub-folder'])
  .build();

const anotherFile = new FileDocumentBuilder()
  .with('id', 'd86d9949-ad4c-4316-9e0e-b34e352045f9')
  .with('name', 'file-name2.txt')
  .build();
