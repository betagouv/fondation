import { Magistrat } from 'shared-models';
import {
  Affectation,
  AffectationsDossiersDeNominations,
  AffectationSnapshot,
  StatutAffectation,
} from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
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
import {
  dossierDeNominationPm,
  users,
} from 'src/modules/framework/drizzle/schemas';
import { faker } from '@faker-js/faker';
import { randomBytes, randomUUID } from 'crypto';

describe('SQL Affectation Repository', () => {
  let sqlAffectationRepository: SqlAffectationRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  let anAffectations: AffectationsDossiersDeNominations[];
  let affectationSnapshot: AffectationSnapshot;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    const rapporteurId = randomUUID();
    await db.insert(users).values({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: randomBytes(32).toString('hex'),
      email: faker.internet.email(),
      gender: 'MALE',
      role: 'MEMBRE_COMMUN',
      id: rapporteurId,
    });

    const dossierId = randomUUID();
    await db.insert(dossierDeNominationPm).values({
      content: {},
      dossierDeNominationImportéId: randomUUID(),
      sessionId: aSessionId,
      id: dossierId,
    });

    anAffectations = [
      {
        dossierDeNominationId: dossierId,
        rapporteurIds: [rapporteurId],
      },
    ];

    affectationSnapshot = {
      id: anAffectationId,
      sessionId: aSessionId,
      formation: aFormation,
      affectationsDossiersDeNominations: anAffectations,
      version: 1,
      statut: StatutAffectation.BROUILLON,
    };

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
      datePublication: null,
      auteurPublication: null,
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
