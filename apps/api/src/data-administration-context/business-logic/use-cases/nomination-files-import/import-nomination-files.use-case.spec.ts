import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Get, Paths } from 'type-fest';
import { EmptyFileError } from '../../errors/empty-file.error';
import { FileLengthTooShortError } from '../../errors/file-length-too-short.error';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';
import { DomainRegistry } from '../../models/domain-registry';
import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
} from '../../models/events/nomination-files-updated.event';
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import { GSHEET_CELL_LINE_BREAK_TOKEN } from '../../models/nomination-file-content-reader';
import {
  Line,
  NominationFileTsvBuilder,
} from '../../models/nomination-file-tsv-builder';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import {
  GetLucienPierreModelSnapshot,
  getLucienPierreModelSnapshotFactory,
  GetMarcelDupontModelSnapshot,
  getMarcelDupontModelSnapshotFactory,
  NominationFileReadRulesBuilder,
} from './import-nomination-files.use-case.fixtures';

const nominationFilesImportedEventId = 'nomination-files-imported-event-id';
const nominationFilesUpdatedEventId = 'nomination-files-updated-event-id';
const anObserverString = `  FIRST OBSERVER${GSHEET_CELL_LINE_BREAK_TOKEN} (1 sur 2)${GSHEET_CELL_LINE_BREAK_TOKEN}TJ de Rennes`;
const anObserverExpected = 'FIRST OBSERVER\n(1 sur 2)\nTJ de Rennes';

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;
  let getMarcelDupontModelSnapshot: GetMarcelDupontModelSnapshot;
  let getLucienPierreModelSnapshot: GetLucienPierreModelSnapshot;

  beforeEach(() => {
    nominationFileRepository = new FakeNominationFileRepository();
    domainEventRepository = new FakeDomainEventRepository();
    transactionPerformer = new NullTransactionPerformer();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = new Date(2024, 10, 10);
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [
      'nomination-file-id',
      nominationFilesImportedEventId,
    ];
    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);

    getMarcelDupontModelSnapshot =
      getMarcelDupontModelSnapshotFactory(dateTimeProvider);
    getLucienPierreModelSnapshot =
      getLucienPierreModelSnapshotFactory(dateTimeProvider);
  });

  it.each([
    [{ fileToImport: `\t\t\t\t\t  `, expectedError: EmptyFileError }],
    [
      {
        fileToImport: new NominationFileTsvBuilder().header,
        expectedError: FileLengthTooShortError,
      },
    ],
  ])(
    'rejects a file with less than 3 lines',
    async ({ fileToImport, expectedError }) => {
      await expect(importAFile(fileToImport)).rejects.toThrow(expectedError);
    },
  );

  it.each<{
    testName: string;
    column: Paths<Line>;
    value: Get<Line, Paths<Line>>;
  }>([
    {
      testName: 'folder number',
      column: 'folderNumber',
      value: '1 (Siège) (Parquet)',
    },
    {
      testName: 'formation',
      column: 'formation',
      value: 'Sièège',
    },
    {
      testName: 'transparency',
      column: 'transparency',
      value: 'Mars 1970',
    },
    {
      testName: 'rules count',
      column: `rules.${NominationFile.RuleGroup.STATUTORY}.${NominationFile.StatutoryRule.MINISTER_CABINET}`,
      value: 'FFALSE',
    },
  ])(
    'rejects all imports if one has an unexpected $testName',
    async ({ column, value }) => {
      await expect(
        importAFile(
          new NominationFileTsvBuilder()
            .fromModelSnapshot(
              getMarcelDupontModelSnapshot('nomination-file-id', 1),
            )
            .with(column, value)
            .build(),
        ),
      ).rejects.toThrow(InvalidRowValueError);
    },
  );

  it('parses a line with all values filled and all rules pre-validated at true', async () => {
    const marcelDupontSnapshot = getMarcelDupontModelSnapshot(
      'nomination-file-id',
      1,
      {
        folderNumber: 1,
        reporters: ['   FIRST Reporter  ', '   SECOND Reporter  '],
        observers: [anObserverString, '  SECOND OBSERVER  '],
        transparency: Transparency.AUTOMNE_2024,
        biography: ' - blabla ',
        formation: Magistrat.Formation.SIEGE,
      },
    );

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(marcelDupontSnapshot)
        .with('folderNumber', ' 1  ' as unknown as number)
        .with('transparency', ' Automne 2024 ')
        .with('biography', ' - blabla ')
        .withFormation(' Siège ')
        .with('dueDate', ' 10/11/2024 ')
        .with('birthDate', ' 01/11/1961 ')
        .build(),
    );

    expectNominationFiles({
      id: 'nomination-file-id',
      createdAt: dateTimeProvider.currentDate,
      rowNumber: marcelDupontSnapshot.rowNumber,
      content: {
        ...marcelDupontSnapshot.content,
        folderNumber: 1,
        reporters: ['FIRST Reporter', 'SECOND Reporter'],
        observers: [anObserverExpected, 'SECOND OBSERVER'],
        transparency: Transparency.AUTOMNE_2024,
        biography: '- blabla',
        formation: Magistrat.Formation.SIEGE,
        dueDate: {
          year: 2024,
          month: 11,
          day: 10,
        },
        birthDate: {
          year: 1961,
          month: 11,
          day: 1,
        },
      },
    });
  });

  it('parses a line with possible empty values unfilled and one rule pre-validated at true', async () => {
    const marcelDupontModelSnapshot = getMarcelDupontModelSnapshot(
      'nomination-file-id',
      1,
      {
        folderNumber: null,
        reporters: null,
        observers: null,
        biography: null,
      },
    );
    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(marcelDupontModelSnapshot)
        .build(),
    );
    expectNominationFiles(marcelDupontModelSnapshot);
  });

  it('saves two lines', async () => {
    const marcelDupontModel = getMarcelDupontModelSnapshot(
      'nomination-file-id',
      1,
    );
    const lucienPierreModel = getLucienPierreModelSnapshot(
      'second-nomination-file-id',
      2,
    );
    uuidGenerator.nextUuids = [
      'nomination-file-id',
      'second-nomination-file-id',
      nominationFilesImportedEventId,
    ];

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(marcelDupontModel)
        .fromModelSnapshot(lucienPierreModel)
        .build(),
    );

    expectNominationFiles(marcelDupontModel, lucienPierreModel);
  });

  describe('when an updated file is imported a second time', () => {
    beforeEach(() => {
      nominationFileRepository.nominationFiles = {
        'nomination-file-id': getFirstRow(),
        'another-id': getMarcelDupontModelSnapshot('another-id', 2),
      };
      uuidGenerator.nextUuids = [
        'lucien-nomination-file-id',
        nominationFilesImportedEventId,
        nominationFilesUpdatedEventId,
      ];
    });

    it("doesn't inform about a new file imported if no new line", async () => {
      await importAFile(
        new NominationFileTsvBuilder().fromModelSnapshot(getFirstRow()).build(),
      );
      expect(domainEventRepository).toHaveDomainEvents();
    });

    it.each<{
      testName: string;
      getTsvValue: () => string;
      getEventPayload: () => NominationFilesUpdatedEventPayload;
    }>([
      {
        testName: 'folder number',
        getTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModelSnapshot(
              getMarcelDupontModelSnapshot('nomination-file-id', 1, {
                folderNumber: 10,
              }),
            )
            .build(),
        getEventPayload: () => [
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
        getTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModelSnapshot(
              getMarcelDupontModelSnapshot('nomination-file-id', 1, {
                observers: [anObserverString],
              }),
            )
            .build(),
        getEventPayload: () => [
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
        getTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModelSnapshot(
              getMarcelDupontModelSnapshot(
                'nomination-file-id',
                1,
                undefined,
                new NominationFileReadRulesBuilder()
                  .with('management.TRANSFER_TIME', false)
                  .build(),
              ),
            )
            .build(),
        getEventPayload: () => [
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
      'informs about an update on $testName',
      async ({ getTsvValue, getEventPayload }) => {
        uuidGenerator.nextUuids = [nominationFilesUpdatedEventId];

        await importAFile(getTsvValue());

        expect(domainEventRepository).toHaveDomainEvents(
          new NominationFilesUpdatedEvent(
            nominationFilesUpdatedEventId,
            getEventPayload(),
            dateTimeProvider.currentDate,
          ),
        );
      },
    );

    it('updates only the nomination file with changed values', async () => {
      jest.spyOn(nominationFileRepository, 'save');
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModelSnapshot(getFirstRow())
          .withRuleTransferTime('FALSE')
          .fromModelSnapshot(getMarcelDupontModelSnapshot('another-id', 2))
          .build(),
      );
      expect(nominationFileRepository.save).toHaveBeenCalledTimes(1);
    });

    const updatedRulesTestData: Array<{
      ruleName: string;
      genTsvValue: () => string;
      getExpectedNominationFile: () => NominationFileModelSnapshot;
    }> = [
      {
        ruleName: 'Transfer Time',
        genTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModelSnapshot(getFirstRow())
            .withRuleTransferTime('FALSE')
            .build(),
        getExpectedNominationFile: () =>
          getMarcelDupontModelSnapshot(
            'nomination-file-id',
            1,
            undefined,
            new NominationFileReadRulesBuilder()
              .with('management.TRANSFER_TIME', false)
              .build(),
          ),
      },
      {
        ruleName: 'Minister Cabinet',
        genTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModelSnapshot(getFirstRow())
            .withRuleMinisterCabinet('FALSE')
            .build(),
        getExpectedNominationFile: () =>
          getMarcelDupontModelSnapshot(
            'nomination-file-id',
            1,
            undefined,
            new NominationFileReadRulesBuilder()
              .with('statutory.MINISTER_CABINET', false)
              .build(),
          ),
      },
    ];

    it.each(updatedRulesTestData)(
      'updates the $ruleName rule',
      async ({ genTsvValue, getExpectedNominationFile }) => {
        await importAFile(genTsvValue());
        expectNominationFiles(
          getExpectedNominationFile(),
          getMarcelDupontModelSnapshot('another-id', 2),
        );
      },
    );

    it.each`
      field                  | updatedContent
      ${'name'}              | ${{ name: 'Other Name' }}
      ${'formation'}         | ${{ formation: Magistrat.Formation.SIEGE }}
      ${'state'}             | ${{ state: NominationFile.ReportState.SUPPORTED }}
      ${'transparency'}      | ${{ transparency: Transparency.AUTOMNE_2024 }}
      ${'grade'}             | ${{ grade: Magistrat.Grade.I }}
      ${'currentPosition'}   | ${{ currentPosition: 'Other Current Position' }}
      ${'targettedPosition'} | ${{ targettedPosition: 'Other Targeted Position' }}
      ${'rank'}              | ${{ rank: 'Other Rank' }}
      ${'birthDate'}         | ${{ birthDate: { year: 1900, month: 1, day: 1 } }}
      ${'biography'}         | ${{ biography: 'Other Biography' }}
    `('cannot update the $field', async ({ updatedContent }) => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModelSnapshot(
            getMarcelDupontModelSnapshot(
              'nomination-file-id',
              1,
              updatedContent,
            ),
          )
          .build(),
      );
      expectNominationFiles(
        getFirstRow(),
        getMarcelDupontModelSnapshot('another-id', 2),
      );
    });

    it('imports only the new line', async () => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModelSnapshot(getFirstRow())
          .fromModelSnapshot(getMarcelDupontModelSnapshot('another-id', 2))
          .fromModelSnapshot(
            getLucienPierreModelSnapshot('lucien-nomination-file-id', 3),
          )
          .build(),
      );
      expectNominationFiles(
        getFirstRow(),
        getMarcelDupontModelSnapshot('another-id', 2),
        getLucienPierreModelSnapshot('lucien-nomination-file-id', 3),
      );
    });

    const getFirstRow = () =>
      getMarcelDupontModelSnapshot('nomination-file-id', 1);
  });

  const importAFile = (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      transactionPerformer,
      new TransparenceService(nominationFileRepository, domainEventRepository),
    ).execute(fileToImport);

  const expectNominationFiles = (
    ...nominationFileSnapshots: NominationFileModelSnapshot[]
  ) => {
    expect(Object.values(nominationFileRepository.nominationFiles)).toEqual(
      nominationFileSnapshots,
    );
  };
});
