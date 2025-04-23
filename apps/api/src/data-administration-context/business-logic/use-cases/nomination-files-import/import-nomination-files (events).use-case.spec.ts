import { FakeNominationFileRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFilesImportedEvent } from '../../models/events/nomination-file-imported.event';
import { NominationFileTsvBuilder } from '../../models/nomination-file-tsv-builder';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import {
  GetLucienPierreModelSnapshot,
  getLucienPierreModelSnapshotFactory,
  GetMarcelDupontModelSnapshot,
  getMarcelDupontModelSnapshotFactory,
  getMarcelDupontRead,
} from './import-nomination-files.use-case.fixtures';
import { Magistrat, Transparency } from 'shared-models';
import { FakeTransparenceRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { GdsNewTransparenceImportedEvent } from '../../models/events/gds-transparence-imported.event';

const nominationFilesImportedEventId = 'nomination-files-imported-event-id';
const gdsTransparenceEventId = 'gds-transparence-event-id';
const gdsTransparenceName = Transparency.AUTOMNE_2024;
const currentDate = new Date(2024, 10, 10);

const aNominationFilesImportedEvent = new NominationFilesImportedEvent(
  nominationFilesImportedEventId,
  [
    {
      nominationFileImportedId: 'nomination-file-id',
      content: getMarcelDupontRead(1).content,
    },
  ],
  currentDate,
);

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;
  let transparenceRepository: FakeTransparenceRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;
  let getMarcelDupontModelSnapshot: GetMarcelDupontModelSnapshot;
  let getLucienPierreModelSnapshot: GetLucienPierreModelSnapshot;

  beforeEach(() => {
    nominationFileRepository = new FakeNominationFileRepository();
    domainEventRepository = new FakeDomainEventRepository();
    transparenceRepository = new FakeTransparenceRepository();
    transactionPerformer = new NullTransactionPerformer();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    uuidGenerator = new DeterministicUuidGenerator();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);

    getMarcelDupontModelSnapshot =
      getMarcelDupontModelSnapshotFactory(dateTimeProvider);
    getLucienPierreModelSnapshot =
      getLucienPierreModelSnapshotFactory(dateTimeProvider);
  });

  it.only('informs about a new transparence imported', async () => {
    uuidGenerator.nextUuids = [
      gdsTransparenceName,
      gdsTransparenceEventId,
      'nomination-file-id',
      nominationFilesImportedEventId,
    ];

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(
          getMarcelDupontModelSnapshot('nomination-file-id', 1, {
            transparency: gdsTransparenceName,
          }),
        )
        .build(),
    );
    expect(Object.values(domainEventRepository.events)).toEqual([
      new GdsNewTransparenceImportedEvent(
        gdsTransparenceEventId,
        {
          transparenceId: gdsTransparenceName,
          formations: [Magistrat.Formation.SIEGE],
          nominationFiles: [getMarcelDupontRead(1).content],
        },
        currentDate,
      ),
      aNominationFilesImportedEvent,
    ]);
  });

  it('informs about a new file imported', async () => {
    uuidGenerator.nextUuids = [
      'nomination-file-id',
      nominationFilesImportedEventId,
    ];

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(
          getMarcelDupontModelSnapshot('nomination-file-id', 1),
        )
        .build(),
    );
    expect(domainEventRepository).toHaveDomainEvents(
      aNominationFilesImportedEvent,
    );
  });

  const importAFile = (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      transactionPerformer,
      new TransparenceService(
        nominationFileRepository,
        domainEventRepository,
        transparenceRepository,
      ),
    ).execute(fileToImport);
});
