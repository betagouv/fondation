import { Magistrat } from 'shared-models';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/business-logic/models/session';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
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
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlSessionRepository = new SqlSessionRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a session', async () => {
    const aSession = Session.nouvelle(
      aSessionId,
      aSessionName,
      aTypeDeSaisine,
      someFormations,
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

    it('retrieves a session by id', async () => {
      const result = await transactionPerformer.perform(
        sqlSessionRepository.session(aSessionId),
      );

      expect(result?.snapshot()).toEqual<SessionSnapshot>(sessionSnapshot);
    });

    it('returns null when a session is not found', async () => {
      const result = await transactionPerformer.perform(
        sqlSessionRepository.session('non-existent-id'),
      );

      expect(result).toBeNull();
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

const aSessionId = 'test-session-id';
const aSessionName = 'test-session-name';
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const someFormations = [Magistrat.Formation.PARQUET, Magistrat.Formation.SIEGE];

const sessionSnapshot: SessionSnapshot = {
  id: aSessionId,
  dataAdministrationImportId: 'test-data-administration-import-id',
  name: aSessionName,
  formations: someFormations,
  typeDeSaisine: aTypeDeSaisine,
  version: 1,
};
