import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { Magistrat } from 'shared-models';
import {
  dossierDeNominationPm,
  users,
} from 'src/modules/framework/drizzle/schemas';
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
import { sessionPm } from './schema';
import { affectationPm } from './schema/affectation-pm';
import { SqlAffectationRepository } from './sql-affectation.repository';

describe('SQL Affectation Repository', () => {
  let sqlAffectationRepository: SqlAffectationRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  const anAffectationId = '490558fb-67b8-4522-9dab-7dc82961e39a';
  const aFormation = Magistrat.Formation.PARQUET;
  let aReporterId: string;
  let aDossierDeNominationId: string;
  let anAffectations: AffectationsDossiersDeNominations[];
  let aSessionId: string;
  let affectationSnapshot: AffectationSnapshot;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const [createdUser] = await db
      .insert(users)
      .values({
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: 'MALE',
        password: faker.string.alphanumeric({ length: 20 }),
        role: 'MEMBRE_COMMUN',
      })
      .returning({ id: users.id });

    aReporterId = createdUser!.id;

    const [session] = await db
      .insert(sessionPm)
      .values({
        content: {},
        formation: aFormation,
        name: faker.lorem.words(7),
        sessionImportéeId: randomUUID(),
        typeDeSaisine: 'TRANSPARENCE_GDS',
      })
      .returning({ id: sessionPm.id });
    aSessionId = session!.id;

    const [nominationFile] = await db
      .insert(dossierDeNominationPm)
      .values({
        dossierDeNominationImportéId: randomUUID(),
        sessionId: aSessionId,
      })
      .returning({ id: dossierDeNominationPm.id });
    aDossierDeNominationId = nominationFile!.id;

    anAffectations = [
      {
        dossierDeNominationId: aDossierDeNominationId,
        rapporteurIds: [aReporterId],
      },
    ];

    affectationSnapshot = {
      id: anAffectationId,
      sessionId: aSessionId,
      version: 1,
      statut: StatutAffectation.BROUILLON,
      formation: aFormation,
      affectationsDossiersDeNominations: anAffectations,
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
      datePublication: undefined,
      auteurPublication: undefined,
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

      expect(affectation?.snapshot()).toEqual({
        ...affectationSnapshot,
        affectationsDossiersDeNominations: expect.any(Array),
      });
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
    ...expectedAffectations: (AffectationSnapshot & {
      createdAt: Date | null;
    })[]
  ) => {
    await db.transaction(async (tx) => {
      const existingAffectations = await tx
        .select()
        .from(affectationPm)
        .execute();

      const expectedVersions = expectedAffectations.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ affectationsDossiersDeNominations: _, ...expected }) => expected,
      );
      expect(existingAffectations).toEqual(
        expectedVersions.map((expectedVersion) =>
          Object.fromEntries(
            Object.entries(expectedVersion).map(([k, v]) =>
              v === undefined ? [k, null] : [k, v],
            ),
          ),
        ),
      );

      for (const version of expectedAffectations) {
        for (const {
          dossierDeNominationId,
          rapporteurIds,
        } of version.affectationsDossiersDeNominations) {
          const reporterIds = await tx.query.drizzleNominationFileToReporterPm
            .findMany({
              columns: { userId: true },
              where: (nfr, { and, eq }) =>
                and(
                  eq(nfr.versionId, version.id),
                  eq(nfr.nominationFileId, dossierDeNominationId),
                ),
            })
            .then((reporters) => reporters.map(({ userId }) => userId));

          for (const expectedReporterId of rapporteurIds) {
            expect(reporterIds).toContain(expectedReporterId);
          }
        }
      }
    });
  };
});
