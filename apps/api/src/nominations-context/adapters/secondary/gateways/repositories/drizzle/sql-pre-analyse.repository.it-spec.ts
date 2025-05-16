import {
  PréAnalyse,
  PréAnalyseSnapshot,
} from 'src/nominations-context/business-logic/models/pré-analyse';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { préAnalysePm } from './schema/pre-analyse-pm';
import { SqlPréAnalyseRepository } from './sql-pre-analyse.repository';
import {
  Règle,
  RègleSnapshot,
} from 'src/nominations-context/business-logic/models/règle';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DomainRegistry } from 'src/nominations-context/business-logic/models/domain-registry';

describe('SQL PréAnalyse Repository', () => {
  let sqlPréAnalyseRepository: SqlPréAnalyseRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlPréAnalyseRepository = new SqlPréAnalyseRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aPréAnalyseId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a préAnalyse', async () => {
    const préAnalyse = PréAnalyse.create(
      aDossierId,
      aRègles.map(Règle.fromSnapshot),
    );

    await transactionPerformer.perform(
      sqlPréAnalyseRepository.save(préAnalyse),
    );

    await expectPréAnalyses({
      ...préAnalyseSnapshot,
      createdAt: expect.any(Date),
    });
  });

  describe('When there is a stored préAnalyse', () => {
    beforeEach(async () => {
      await db.insert(préAnalysePm).values(préAnalyseSnapshot);
    });

    it('retrieves a préAnalyse by id', async () => {
      const result = await transactionPerformer.perform(
        sqlPréAnalyseRepository.findById(aPréAnalyseId),
      );

      expect(result?.snapshot()).toEqual<PréAnalyseSnapshot>(
        préAnalyseSnapshot,
      );
    });

    it('retrieves a préAnalyse by dossier id', async () => {
      const result = await transactionPerformer.perform(
        sqlPréAnalyseRepository.findByDossierId(aDossierId),
      );

      expect(result?.snapshot()).toEqual<PréAnalyseSnapshot>(
        préAnalyseSnapshot,
      );
    });

    it('returns null when a préAnalyse is not found', async () => {
      const nonExistentId = `${aDossierId}`;
      const result = await transactionPerformer.perform(
        sqlPréAnalyseRepository.findById(nonExistentId),
      );

      expect(result).toBeNull();
    });

    it('updates an existing préAnalyse', async () => {
      const updatedPréAnalyse = PréAnalyse.fromSnapshot({
        ...préAnalyseSnapshot,
        règles: updatedRègles,
      });

      await transactionPerformer.perform(
        sqlPréAnalyseRepository.save(updatedPréAnalyse),
      );

      await expectPréAnalyses({
        ...préAnalyseSnapshot,
        règles: updatedRègles,
        createdAt: expect.any(Date),
      });
    });
  });

  const expectPréAnalyses = async (
    ...expectedPréAnalyses: (typeof préAnalysePm.$inferSelect)[]
  ) => {
    const existingPréAnalyses = await db.select().from(préAnalysePm).execute();
    expect(existingPréAnalyses).toEqual<(typeof préAnalysePm.$inferSelect)[]>(
      expectedPréAnalyses,
    );
  };
});

const aPréAnalyseId = '2e470647-787c-474d-aa21-f8129b772aee';
const aDossierId = '733f92e9-57c7-4202-a742-d9a040104ccb';
const aRègles: RègleSnapshot[] = [
  {
    group: 'test-group',
    name: 'test-name',
    value: true,
  },
];
const updatedRègles = [
  {
    group: 'test-group',
    name: 'test-name',
    value: false,
  },
  {
    group: 'test-group',
    name: 'test-name-2',
    value: true,
  },
];

const préAnalyseSnapshot: PréAnalyseSnapshot = {
  id: aPréAnalyseId,
  dossierDeNominationId: aDossierId,
  règles: aRègles,
};
