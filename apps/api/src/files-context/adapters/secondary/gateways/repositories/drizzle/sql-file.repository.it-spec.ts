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

const aFile = new FileDocumentBuilder()
  .with('id', 'd86d9949-ad4c-4316-9e0e-b34e352045f8')
  .with('path', ['main-folder', 'sub-folder'])
  .with('name', 'file-name.txt')
  .build();
const anotherFile = FileDocumentBuilder.fromSnapshot(aFile)
  .with('id', 'aa4a4a07-435d-4004-94fe-1d0980aac693')
  .with('name', 'other-file-name.txt')
  .build();

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

    const existingFiles = await db.select().from(filesPm).execute();
    expect(existingFiles).toEqual([SqlFileRepository.mapSnapshotToDb(aFile)]);
  });

  describe('when there are already files', () => {
    beforeEach(async () => {
      await givenSomeFiles(aFile, anotherFile);
    });

    it('gets files', async () => {
      const askedFiles = [aFile, anotherFile];
      const files = await transactionPerformer.perform(
        filesRepository.getByIds(askedFiles.map((askedFile) => askedFile.id)),
      );
      expect(files).toHaveLength(askedFiles.length);
      expect(files).toEqual<FileDocument[]>(
        askedFiles.map(FileDocument.fromSnapshot),
      );
    });

    it('deletes one file', async () => {
      await transactionPerformer.perform(
        filesRepository.deleteFile(FileDocument.fromSnapshot(aFile)),
      );
      const files = await db.select().from(filesPm).execute();
      expect(files).toEqual([SqlFileRepository.mapSnapshotToDb(anotherFile)]);
    });
  });

  const givenSomeFiles = async (...files: FileDocumentSnapshot[]) =>
    db
      .insert(filesPm)
      .values(files.map(SqlFileRepository.mapSnapshotToDb))
      .execute();
});
