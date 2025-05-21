import { Magistrat } from 'shared-models';
import {
  Affectation,
  AffectationsDossiersDeNominations,
  AffectationSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { affectationPm } from './schema/affectation-pm';
import { SqlAffectationRepository } from './sql-affectation.repository';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';

describe('SQL Affectation Repository', () => {
  let sqlAffectationRepository: SqlAffectationRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlAffectationRepository = new SqlAffectationRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [anAffectationId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves an affectation', async () => {
    const affectation = Affectation.nouvelle(
      aSessionId,
      aFormation,
      anAffectations,
    );

    await transactionPerformer.perform(
      sqlAffectationRepository.save(affectation),
    );

    await expectAffectations({
      ...affectationSnapshot,
      createdAt: expect.any(Date),
    });
  });

  describe('When there is a stored affectation', () => {
    beforeEach(async () => {
      await db.insert(affectationPm).values(affectationSnapshot);
    });

    it('retrieves an affectation by session ID', async () => {
      const affectation = await transactionPerformer.perform(
        sqlAffectationRepository.bySessionId(aSessionId),
      );

      expect(affectation?.snapshot()).toEqual<AffectationSnapshot>(
        affectationSnapshot,
      );
    });

    it('returns null when an affectation is not found', async () => {
      const fakeId = 'cd4bb1cb-9c34-4c47-803e-92d77aa6d9ce';
      const result = await transactionPerformer.perform(
        sqlAffectationRepository.bySessionId(fakeId),
      );

      expect(result).toBeNull();
    });
  });

  const expectAffectations = async (
    ...expectedAffectations: (typeof affectationPm.$inferSelect)[]
  ) => {
    const existingAffectations = await db
      .select()
      .from(affectationPm)
      .execute();
    expect(existingAffectations).toEqual<(typeof affectationPm.$inferSelect)[]>(
      expectedAffectations,
    );
  };
});

const anAffectationId = '490558fb-67b8-4522-9dab-7dc82961e39a';
const aSessionId = '550da006-4f50-4c9e-b2b9-9342d3406ee9';
const aFormation = Magistrat.Formation.PARQUET;
const anAffectations: AffectationsDossiersDeNominations[] = [
  {
    dossierDeNominationId: '3024f09a-1663-4c9c-a730-b9221f1b0067',
    rapporteurIds: ['943e9546-3735-454f-92a9-e2e9ad4f7ea6'],
  },
];

const affectationSnapshot: AffectationSnapshot = {
  id: anAffectationId,
  sessionId: aSessionId,
  formation: aFormation,
  affectationsDossiersDeNominations: anAffectations,
};
