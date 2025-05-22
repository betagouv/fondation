import { Magistrat } from 'shared-models';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/session';
import { TypeDeSaisine } from 'shared-models';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { sessionPm } from './schema/session-pm';
import { SqlSessionRepository } from './sql-session.repository';

describe('SQL Session Repository', () => {
  let sqlSessionRepository: SqlSessionRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlSessionRepository = new SqlSessionRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aSessionId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a session', async () => {
    const aSession = Session.nouvelle(
      aSessionimportéeId,
      aSessionName,
      aTypeDeSaisine,
      aFormation,
    );

    await transactionPerformer.perform(sqlSessionRepository.save(aSession));

    await expectSessions({
      ...sessionSnapshot,
      createdAt: expect.any(Date),
    });
  });

  describe('When there is a stored session', () => {
    beforeEach(async () => {
      await db.insert(sessionPm).values(sessionSnapshot);
    });

    describe('by ID', () => {
      it('retrieves a session', async () => {
        const result = await transactionPerformer.perform(
          sqlSessionRepository.session(aSessionId),
        );

        expect(result?.snapshot()).toEqual<SessionSnapshot>(sessionSnapshot);
      });

      it('returns null when a session is not found', async () => {
        const nonExistentId = '885e0f4b-0ace-4023-a8bc-b3a678448e51';
        const result = await transactionPerformer.perform(
          sqlSessionRepository.session(nonExistentId),
        );

        expect(result).toBeNull();
      });
    });

    describe('by session import ID', () => {
      it('retrieves a session', async () => {
        const result = await transactionPerformer.perform(
          sqlSessionRepository.bySessionImportéeId(aSessionimportéeId),
        );

        expect(result?.snapshot()).toEqual<SessionSnapshot>(sessionSnapshot);
      });

      it('returns null when a session is not found', async () => {
        const nonExistentId = '885e0f4b-0ace-4023-a8bc-b3a678448e51';
        const result = await transactionPerformer.perform(
          sqlSessionRepository.bySessionImportéeId(nonExistentId),
        );

        expect(result).toBeNull();
      });
    });

    it('updates an existing session', async () => {
      const newName = 'New Name';
      const updatedSession = Session.fromSnapshot({
        ...sessionSnapshot,
        name: newName,
      });

      await transactionPerformer.perform(
        sqlSessionRepository.save(updatedSession),
      );

      await expectSessions({
        ...sessionSnapshot,
        name: newName,
        version: 2,
        createdAt: expect.any(Date),
      });
    });
  });

  const expectSessions = async (
    ...expectedSessions: (typeof sessionPm.$inferSelect)[]
  ) => {
    const existingSessions = await db.select().from(sessionPm).execute();
    expect(existingSessions).toEqual<(typeof sessionPm.$inferSelect)[]>(
      expectedSessions,
    );
  };
});

const aSessionId = '733f92e9-57c7-4202-a742-d9a040104ccb';
const aSessionName = 'test-session-name';
const aSessionimportéeId = '2e470647-787c-474d-aa21-f8129b772aee';
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aFormation = Magistrat.Formation.PARQUET;

const sessionSnapshot: SessionSnapshot = {
  id: aSessionId,
  sessionImportéeId: aSessionimportéeId,
  name: aSessionName,
  formation: aFormation,
  typeDeSaisine: aTypeDeSaisine,
  version: 1,
};
