import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { sessionPm } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema/session-pm';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { SqlTransparenceRepository } from './sql-transparence.repository';

describe('SQL Transparence Repository', () => {
  let sqlTransparenceRepository: SqlTransparenceRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlTransparenceRepository = new SqlTransparenceRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aSessionId];
    DomainRegistry.setUuidGenerator(uuidGenerator);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('When there is a stored session', () => {
    beforeEach(async () => {
      await db.insert(sessionPm).values({
        ...sessionSnapshot,
        content: {
          dateTransparence: uneDateTransparence,
          dateClôtureDélaiObservation: null,
        },
      });
    });

    describe('by nom, formation, and dateTransparence', () => {
      it('retrieves a transparency session with exact date match', async () => {
        const result = await transactionPerformer.perform(
          sqlTransparenceRepository.byNomFormationEtDate(
            aSessionName,
            aFormation,
            uneDateTransparence,
          ),
        );

        expect(result?.snapshot()).toEqual(sessionSnapshot);
      });

      it('does not retrieve a transparency session when only the day differs', async () => {
        const result = await transactionPerformer.perform(
          sqlTransparenceRepository.byNomFormationEtDate(
            aSessionName,
            aFormation,
            { ...uneDateTransparence, day: uneDateTransparence.day + 1 },
          ),
        );

        expect(result).toBeNull();
      });

      it('does not retrieve a transparency session when name differs', async () => {
        const result = await transactionPerformer.perform(
          sqlTransparenceRepository.byNomFormationEtDate(
            'Différent nom',
            aFormation,
            uneDateTransparence,
          ),
        );

        expect(result).toBeNull();
      });

      it('does not retrieve a transparency session when formation differs', async () => {
        const result = await transactionPerformer.perform(
          sqlTransparenceRepository.byNomFormationEtDate(
            aSessionName,
            Magistrat.Formation.SIEGE,
            uneDateTransparence,
          ),
        );

        expect(result).toBeNull();
      });
    });
  });
});

const aSessionId = '733f92e9-57c7-4202-a742-d9a040104ccb';
const aSessionName = 'test-session-name';
const aSessionimportéeId = '2e470647-787c-474d-aa21-f8129b772aee';
const aTypeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const aFormation = Magistrat.Formation.PARQUET;

const uneDateTransparence: DateOnlyJson = {
  year: 2023,
  month: 5,
  day: 15,
};

const sessionSnapshot: SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS> = {
  id: aSessionId,
  sessionImportéeId: aSessionimportéeId,
  name: aSessionName,
  formation: aFormation,
  typeDeSaisine: aTypeDeSaisine,
  version: 1,
  content: {
    dateTransparence: uneDateTransparence,
    dateClôtureDélaiObservation: null,
  },
};
