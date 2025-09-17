import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';

import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { dossierDeNominationPm } from 'src/nominations-context/dossier-de-nominations/adapters/primary/secondary/gateways/repositories/drizzle/schema/dossier-de-nomination-pm';
import { DossierDeNomination } from 'src/nominations-context/dossier-de-nominations/business-logic/models/dossier-de-nomination';
import { SqlDossierDeNominationRepository } from './sql-dossier-de-nomination.repository';

describe('SQL Dossier De Nomination Repository', () => {
  let sqlDossierDeNominationRepository: SqlDossierDeNominationRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlDossierDeNominationRepository = new SqlDossierDeNominationRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aDossierId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(new DeterministicDateProvider());
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a dossier de nomination', async () => {
    const [dossier] = DossierDeNomination.create(
      aSessionId,
      aImportId,
      aContent,
    );

    await transactionPerformer.perform(
      sqlDossierDeNominationRepository.save(dossier),
    );

    await expectDossiers({
      id: dossier.id,
      sessionId: aSessionId,
      dossierDeNominationImportéId: aImportId,
      content: aContent,
      createdAt: expect.any(Date),
    });
  });

  describe('When there are stored dossiers', () => {
    beforeEach(async () => {
      await db.insert(dossierDeNominationPm).values({
        id: aDossierId,
        sessionId: aSessionId,
        dossierDeNominationImportéId: aImportId,
        content: aContent,
      });

      await db.insert(dossierDeNominationPm).values({
        id: '89bbd370-e0ac-448a-a118-b276c663cdb7',
        sessionId: aSessionId,
        dossierDeNominationImportéId: '3888a6a2-4d0d-43fd-bc22-b696f434ac8c',
        content: aContent,
      });
    });

    describe('by id', () => {
      it('retrieves a dossier', async () => {
        const result = await transactionPerformer.perform(
          sqlDossierDeNominationRepository.dossierDeNomination(aDossierId),
        );

        expect(result?.snapshot()).toEqual<DossierDeNominationSnapshot>({
          id: aDossierId,
          sessionId: aSessionId,
          nominationFileImportedId: aImportId,
          content: aContent,
        });
      });

      it('returns nothing when a dossier is not found', async () => {
        const nonExistentId = `${aImportId}`;
        const result = await transactionPerformer.perform(
          sqlDossierDeNominationRepository.dossierDeNomination(nonExistentId),
        );

        expect(result).toBeNull();
      });
    });

    describe('by imported id', () => {
      it('retrieves a dossier', async () => {
        const result = await transactionPerformer.perform(
          sqlDossierDeNominationRepository.findByImportedId(aImportId),
        );

        expect(result?.snapshot()).toEqual<DossierDeNominationSnapshot>({
          id: aDossierId,
          sessionId: aSessionId,
          nominationFileImportedId: aImportId,
          content: aContent,
        });
      });

      it('returns nothing when a dossier is not found', async () => {
        const nonExistentId = `${aDossierId}`;
        const result = await transactionPerformer.perform(
          sqlDossierDeNominationRepository.findByImportedId(nonExistentId),
        );

        expect(result).toBeNull();
      });
    });
  });

  const expectDossiers = async (
    ...expectedDossiers: (typeof dossierDeNominationPm.$inferSelect)[]
  ) => {
    const existingDossiers = await db
      .select()
      .from(dossierDeNominationPm)
      .execute();
    expect(existingDossiers).toEqual<
      (typeof dossierDeNominationPm.$inferSelect)[]
    >(expectedDossiers);
  };
});

const aDossierId = 'cd4bb1cb-9c34-4c47-803e-92d77aa6d9ce';
const aSessionId = '343fd922-2d00-4018-87c5-e4c66140f98b';
const aImportId = 'aec19e67-dc06-475f-909d-e4eb63d8e081';
const aContent = {
  folderNumber: 123,
  name: 'John Doe',
};
