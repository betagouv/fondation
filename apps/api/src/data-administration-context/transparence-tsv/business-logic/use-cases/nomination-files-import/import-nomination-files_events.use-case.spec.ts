import { Magistrat, NominationFile } from 'shared-models';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparence-tsv/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { FakeUserService } from 'src/data-administration-context/transparence-tsv/adapters/secondary/gateways/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainRegistry } from '../../models/domain-registry';
import { GdsNewTransparenceImportedEvent } from '../../models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEvent } from '../../models/events/gds-transparence-nomination-files-added.event';
import {
  GdsTransparenceNominationFilesModifiedEvent,
  GdsTransparenceNominationFilesModifiedEventPayload,
} from '../../models/events/gds-transparence-nomination-files-modified.event';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { NominationFileTsvBuilder } from '../../models/nomination-file-tsv-builder';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import {
  anObserverExpected,
  anObserverString,
  currentDate,
  emilienRenaudJulesReporterId,
  emilienRenaudJulesUser,
  gdsTransparenceEventId,
  gdsTransparenceId,
  gdsTransparenceName,
  GetMarcelDupontModelSnapshot,
  getMarcelDupontModelSnapshotFactory,
  getMarcelDupontRead,
  jeanneLouiseDeFranceAudeReporterId,
  jeanneLouiseDeFranceAudeUser,
  lucLoïcReporterId,
  lucLoïcUser,
  NominationFileReadRulesBuilder,
} from './import-nomination-files.use-case.fixtures';

const nominationFileId = 'nomination-file-id';
const nominationFilesImportedEventId = 'nomination-files-imported-event-id';

const aGdsNewtransparenceImportedEvent = new GdsNewTransparenceImportedEvent(
  gdsTransparenceEventId,
  {
    transparenceId: gdsTransparenceId,
    transparenceName: gdsTransparenceName,
    formation: Magistrat.Formation.SIEGE,
    nominationFiles: [
      {
        nominationFileId,
        content: {
          ...getMarcelDupontRead(1).content,
          reporterIds: [
            lucLoïcReporterId,
            emilienRenaudJulesReporterId,
            jeanneLouiseDeFranceAudeReporterId,
          ],
        },
      },
    ],
  },
  currentDate,
);

const aGdsTransparenceNominationFilesAddedEvent =
  new GdsTransparenceNominationFilesAddedEvent(
    gdsTransparenceEventId,
    {
      transparenceId: gdsTransparenceId,
      transparenceName: gdsTransparenceName,
      nominationFiles: [
        {
          nominationFileId,
          content: {
            ...getMarcelDupontRead(2).content,
            reporterIds: [
              lucLoïcReporterId,
              emilienRenaudJulesReporterId,
              jeanneLouiseDeFranceAudeReporterId,
            ],
          },
        },
      ],
    },
    currentDate,
  );

describe('Import Nomination Files Use Case', () => {
  let transparenceRepository: FakeTransparenceRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;
  let userService: FakeUserService;
  let getMarcelDupontModelSnapshot: GetMarcelDupontModelSnapshot;
  let firstNominationFile: NominationFileModelSnapshot;

  beforeEach(() => {
    domainEventRepository = new FakeDomainEventRepository();
    transparenceRepository = new FakeTransparenceRepository();
    transactionPerformer = new NullTransactionPerformer();
    userService = new FakeUserService();
    userService.addUsers(
      lucLoïcUser,
      emilienRenaudJulesUser,
      jeanneLouiseDeFranceAudeUser,
    );

    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    uuidGenerator = new DeterministicUuidGenerator();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
    DomainRegistry.setDomainEventRepository(domainEventRepository);

    getMarcelDupontModelSnapshot =
      getMarcelDupontModelSnapshotFactory(dateTimeProvider);

    firstNominationFile = getMarcelDupontModelSnapshot(nominationFileId, 1, {
      transparency: gdsTransparenceName,
    });
  });

  it('informs about a new transparence imported', async () => {
    uuidGenerator.nextUuids = [
      nominationFileId,
      gdsTransparenceId,
      gdsTransparenceEventId,
      nominationFilesImportedEventId,
    ];
    await importNominationFiles(firstNominationFile);
    expectDomainEvents(aGdsNewtransparenceImportedEvent);
  });

  describe('When a transparence is already imported', () => {
    let secondNominationFile: NominationFileModelSnapshot;

    beforeEach(() => {
      uuidGenerator.nextUuids = [
        nominationFileId,
        gdsTransparenceEventId,
        nominationFilesImportedEventId,
      ];

      secondNominationFile = getMarcelDupontModelSnapshot(
        'second-nomination-file-id',
        2,
        {
          transparency: gdsTransparenceName,
        },
      );

      transparenceRepository.addTransparence(gdsTransparenceId, {
        id: gdsTransparenceId,
        createdAt: currentDate,
        name: gdsTransparenceName,
        formation: Magistrat.Formation.SIEGE,
        nominationFiles: [firstNominationFile],
      });
    });

    it('do nothing if there is no change in the transparency', async () => {
      await importNominationFiles(firstNominationFile);
      expectDomainEvents();
    });

    it('informs about a new nomination file imported', async () => {
      await importNominationFiles(firstNominationFile, secondNominationFile);
      expectDomainEvents(aGdsTransparenceNominationFilesAddedEvent);
    });

    it.each<{
      testName: string;
      getNominationFile: () => NominationFileModelSnapshot;
      eventPayload: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'];
    }>([
      {
        testName: 'folder number',
        getNominationFile: () =>
          getMarcelDupontModelSnapshot('nomination-file-id', 1, {
            folderNumber: 10,
          }),
        eventPayload: [
          {
            nominationFileId: 'nomination-file-id',
            content: {
              folderNumber: 10,
            },
          },
        ],
      },
      {
        testName: 'observers',
        getNominationFile: () =>
          getMarcelDupontModelSnapshot('nomination-file-id', 1, {
            observers: [anObserverString],
          }),
        eventPayload: [
          {
            nominationFileId: 'nomination-file-id',
            content: {
              observers: [anObserverExpected],
            },
          },
        ],
      },
      {
        testName: 'rules',
        getNominationFile: () =>
          getMarcelDupontModelSnapshot(
            'nomination-file-id',
            1,
            undefined,
            new NominationFileReadRulesBuilder()
              .with('management.TRANSFER_TIME', false)
              .build(),
          ),
        eventPayload: [
          {
            nominationFileId: 'nomination-file-id',
            content: {
              rules: {
                [NominationFile.RuleGroup.MANAGEMENT]: {
                  [NominationFile.ManagementRule.TRANSFER_TIME]: false,
                },
              },
            },
          },
        ],
      },
    ])(
      'informs about a nomination file modification on $testName',
      async ({ getNominationFile: getTsvValue, eventPayload }) => {
        uuidGenerator.nextUuids = [
          gdsTransparenceEventId,
          nominationFileId,
          nominationFilesImportedEventId,
        ];
        await importNominationFiles(getTsvValue());
        expectDomainEvents(
          getGdsTransparenceNominationFilesModifiedEvent(eventPayload),
        );
      },
    );
  });

  const importNominationFiles = (
    ...nominationFiles: NominationFileModelSnapshot[]
  ) => {
    const builder = new NominationFileTsvBuilder();
    nominationFiles.forEach((nominationFile) => {
      builder.fromModelSnapshot(nominationFile);
    });

    return new ImportNominationFilesUseCase(
      transactionPerformer,
      new TransparenceService(
        domainEventRepository,
        transparenceRepository,
        userService,
      ),
    ).execute(builder.build());
  };

  const expectDomainEvents = (...events: any[]) => {
    expect(Object.values(domainEventRepository.events)).toEqual(events);
  };
});

const getGdsTransparenceNominationFilesModifiedEvent = (
  nominationFilesPayload: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'],
) =>
  new GdsTransparenceNominationFilesModifiedEvent(
    gdsTransparenceEventId,
    {
      transparenceId: gdsTransparenceId,
      transparenceName: gdsTransparenceName,
      nominationFiles: nominationFilesPayload,
    },
    currentDate,
  );
