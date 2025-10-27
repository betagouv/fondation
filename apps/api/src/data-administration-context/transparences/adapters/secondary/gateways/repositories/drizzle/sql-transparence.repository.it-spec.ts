import { Magistrat, Transparency } from 'shared-models';
import { Avancement } from 'src/data-administration-context/lodam/business-logic/models/avancement';
import { NominationFileModelSnapshot } from 'src/data-administration-context/transparence-xlsx/business-logic/models/nomination-file';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';
import { DomainRegistry } from 'src/data-administration-context/transparences/business-logic/models/domain-registry';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { transparencesPm } from './schema';
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
      await givenSomeTransparence(anotherTransparence, aTransparence);
      const transpa = await transparence();
      expect(transpa?.snapshot()).toEqual<TransparenceSnapshot>(aTransparence);
    });
  });

  const givenSomeTransparence = async (...transpas: TransparenceSnapshot[]) => {
    for (const transpa of transpas) {
      await db
        .insert(transparencesPm)
        .values({
          ...transpa,
          dateTransparence: DateOnly.fromJson(
            transpa.dateTransparence,
          ).toDate(),
          dateEchéance: transpa.dateEchéance
            ? DateOnly.fromJson(transpa.dateEchéance).toDate()
            : null,
          datePriseDePosteCible: transpa.datePriseDePosteCible
            ? DateOnly.fromJson(transpa.datePriseDePosteCible).toDate()
            : null,
          dateClôtureDélaiObservation: DateOnly.fromJson(
            transpa.dateClôtureDélaiObservation,
          ).toDate(),
          nominationFiles: transpa.nominationFiles.map((nominationFile) => ({
            ...nominationFile,
            createdAt: currentDate.toISOString(),
          })),
        })
        .execute();
    }
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
        aTransparence.dateTransparence,
      ),
    );

  const expectTransparence = async (transpa: TransparenceSnapshot) => {
    const result = await db.select().from(transparencesPm).execute();

    expect(result).toHaveLength(1);
    expect(result).toEqual<(typeof transparencesPm.$inferSelect)[]>([
      {
        ...transpa,
        formation: transpa.formation,
        dateTransparence: DateOnly.fromJson(transpa.dateTransparence).toDate(),
        dateEchéance: DateOnly.fromJson(transpa.dateEchéance!).toDate(),
        datePriseDePosteCible: DateOnly.fromJson(
          transpa.datePriseDePosteCible!,
        ).toDate(),
        dateClôtureDélaiObservation: DateOnly.fromJson(
          transpa.dateClôtureDélaiObservation,
        ).toDate(),
        nominationFiles: transpa.nominationFiles.map((nominationFile) => ({
          ...nominationFile,
          createdAt: currentDate.toISOString(),
        })),
      },
    ]);
  };
});

const aNominationfile: NominationFileModelSnapshot = {
  id: aNominationFileId,
  createdAt: currentDate,
  rowNumber: 1,
  content: {
    numeroDeDossier: 1,
    magistrat: 'Test Person',
    reporters: ['Test Reporter'],
    grade: Magistrat.Grade.HH,
    posteActuel: 'Current Position',
    posteCible: 'Target Position',
    rank: '(1 sur 10)',
    dateDeNaissance: {
      year: 1980,
      month: 1,
      day: 1,
    },
    historique: 'Test biography',
    observers: ['Test Observer'],

    equivalenceOuAvancement: Avancement.AVANCEMENT,
    datePassageAuGrade: {
      day: 1,
      month: 1,
      year: 2000,
    },
    datePriseDeFonctionPosteActuel: {
      day: 1,
      month: 1,
      year: 2002,
    },
    informationCarriere: 'information de carrière',
  },
};

const aTransparence: TransparenceSnapshot = {
  id: aTransparenceId,
  createdAt: currentDate,
  name: Transparency.AUTOMNE_2024,
  formation: Magistrat.Formation.PARQUET,
  dateTransparence: {
    year: 2025,
    month: 10,
    day: 1,
  },
  dateEchéance: {
    year: 2027,
    month: 10,
    day: 1,
  },
  datePriseDePosteCible: {
    year: 2024,
    month: 1,
    day: 1,
  },
  dateClôtureDélaiObservation: {
    year: 2023,
    month: 10,
    day: 1,
  },
  nominationFiles: [aNominationfile],
};

const aModifiedTransparence: TransparenceSnapshot = {
  ...aTransparence,
  nominationFiles: [
    {
      ...aNominationfile,
      content: {
        ...aNominationfile.content,
        numeroDeDossier: 100,
      },
    },
  ],
};

const anotherTransparence: TransparenceSnapshot = {
  ...aTransparence,
  id: 'fbb7ae24-bd41-43c3-bac1-554512726c78',
  formation: Magistrat.Formation.SIEGE,
  nominationFiles: [
    {
      ...aNominationfile,
      id: 'e3fb8d3f-1553-4c77-89cb-e5dd5843b9ae',
    },
  ],
};
