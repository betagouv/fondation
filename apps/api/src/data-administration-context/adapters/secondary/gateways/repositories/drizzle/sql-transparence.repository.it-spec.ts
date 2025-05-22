import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import { TransparenceRepository } from 'src/data-administration-context/business-logic/gateways/repositories/transparence.repository';
import { DomainRegistry } from 'src/data-administration-context/business-logic/models/domain-registry';
import { NominationFileModelSnapshot } from 'src/data-administration-context/business-logic/models/nomination-file';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/data-administration-context/business-logic/models/transparence';
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
import { transparencesPm } from './schema/transparence-pm';
import { SqlTransparenceRepository } from './sql-transparence.repository';

const aTransparenceId = 'ad0b430b-e647-475d-b942-9908901120da';
const aNominationFileId = 'e022252d-913c-4523-8ae3-ad9b9fcb4757';
const currentDate = new Date(2023, 0, 15);

describe('SQL Transparence Repository', () => {
  let db: DrizzleDb;
  let transparenceRepository: TransparenceRepository;
  let transactionPerformer: TransactionPerformer;
  let dateProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    transactionPerformer = new DrizzleTransactionPerformer(db);
    transparenceRepository = new SqlTransparenceRepository();

    dateProvider = new DeterministicDateProvider();
    dateProvider.currentDate = currentDate;

    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aTransparenceId];

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateProvider);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('save', () => {
    it('saves a transparence', async () => {
      await saveTransparence(aTransparence);
      await expectTransparence(aTransparence);
    });

    it('updates the transparence', async () => {
      await givenSomeTransparence(aTransparence);
      await saveTransparence(aModifiedTransparence);
      await expectTransparence(aModifiedTransparence);
    });
  });

  describe('retrieve transparence', () => {
    it('returns nothing when transparence is not found', async () => {
      expect(await transparence()).toBeNull();
    });

    it('returns the transparence when it exists', async () => {
      await givenSomeTransparence(aTransparence);
      const transpa = await transparence();
      expect(transpa?.snapshot()).toEqual<TransparenceSnapshot>(aTransparence);
    });
  });

  const givenSomeTransparence = async (transpa: TransparenceSnapshot) => {
    await db
      .insert(transparencesPm)
      .values({
        ...transpa,
        formation: transpa.formation,
        nominationFiles: transpa.nominationFiles.map((nominationFile) => ({
          ...nominationFile,
          createdAt: currentDate.toISOString(),
        })),
      })
      .execute();
  };

  const saveTransparence = (transpa: TransparenceSnapshot) =>
    transactionPerformer.perform(
      transparenceRepository.save(Transparence.fromSnapshot(transpa)),
    );

  const transparence = () =>
    transactionPerformer.perform(
      transparenceRepository.transparence(
        aTransparence.name,
        aTransparence.formation,
      ),
    );

  const expectTransparence = async (transpa: TransparenceSnapshot) => {
    const result = await db.select().from(transparencesPm).execute();

    expect(result).toHaveLength(1);
    expect(result).toEqual<(typeof transparencesPm.$inferSelect)[]>([
      {
        ...transpa,
        formation: transpa.formation,
        nominationFiles: transpa.nominationFiles.map((nominationFile) => ({
          ...nominationFile,
          createdAt: currentDate.toISOString(),
        })),
      },
    ]);
  };
});

class TrueRulesBuilder extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor() {
    super(true, allRulesMapV1);
  }
}

const aNominationfile: NominationFileModelSnapshot = {
  id: aNominationFileId,
  createdAt: currentDate,
  rowNumber: 1,
  content: {
    folderNumber: 1,
    name: 'Test Person',
    formation: Magistrat.Formation.PARQUET,
    dueDate: null,
    transparency: Transparency.AUTOMNE_2024,
    reporters: ['Test Reporter'],
    grade: Magistrat.Grade.HH,
    currentPosition: 'Current Position',
    targettedPosition: 'Target Position',
    rank: '(1 sur 10)',
    birthDate: {
      year: 1980,
      month: 1,
      day: 1,
    },
    biography: 'Test biography',
    observers: ['Test Observer'],
    rules: new TrueRulesBuilder().build(),
  },
};

const aTransparence: TransparenceSnapshot = {
  id: aTransparenceId,
  createdAt: currentDate,
  name: Transparency.AUTOMNE_2024,
  formation: Magistrat.Formation.PARQUET,
  nominationFiles: [aNominationfile],
};

const aModifiedTransparence: TransparenceSnapshot = {
  ...aTransparence,
  nominationFiles: [
    {
      ...aNominationfile,
      content: {
        ...aNominationfile.content,
        folderNumber: 100,
      },
    },
  ],
};
