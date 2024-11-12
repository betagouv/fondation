import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileRepository } from 'src/data-administration-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { Get, PartialDeep, Paths } from 'type-fest';
import { EmptyFileError } from '../../errors/empty-file.error';
import { FileLengthTooShortError } from '../../errors/file-length-too-short.error';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';
import { NominationFileModel } from '../../models/nomination-file';
import { GSHEET_CELL_LINE_BREAK_TOKEN } from '../../models/nomination-file-content-reader';
import { NominationFilesImportedEvent } from '../../models/events/nomination-file-imported.event';
import { NominationFileRead } from '../../models/nomination-file-read';
import {
  Line,
  NominationFileTsvBuilder,
} from '../../models/nomination-file-tsv-builder';
import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
} from '../../models/events/nomination-files-updated.event';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';

const nominationFilesImportedEventId = 'nomination-files-imported-event-id';
const nominationFilesUpdatedEventId = 'nomination-files-updated-event-id';
const anObserverString = `  FIRST OBSERVER${GSHEET_CELL_LINE_BREAK_TOKEN}(1 sur 2)${GSHEET_CELL_LINE_BREAK_TOKEN}TJ de Rennes`;
const anObserverExpected = 'FIRST OBSERVER\n(1 sur 2)\nTJ de Rennes';

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;

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
      testName: 'existing state "ready to support" value forbidden in gsheet',
      column: 'state',
      value: 'Prêt à soutenir',
    },
    {
      testName: 'existing state "in progress" value forbidden in gsheet',
      column: 'state',
      value: 'En cours',
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
            .fromModel(getMarcelDupontModel('nomination-file-id', 1))
            .with(column, value)
            .build(),
        ),
      ).rejects.toThrow(InvalidRowValueError);
    },
  );

  it('informs about a new file imported', async () => {
    await importAFile(
      new NominationFileTsvBuilder()
        .fromModel(getMarcelDupontModel('nomination-file-id', 1))
        .build(),
    );
    expect(domainEventRepository).toHaveDomainEvents(
      new NominationFilesImportedEvent(
        nominationFilesImportedEventId,
        [
          {
            nominationFileImportedId: 'nomination-file-id',
            content: getMarcelDupontRead(1).content,
          },
        ],
        dateTimeProvider.currentDate,
      ),
    );
  });

  it('parses a line with all values filled and all rules pre-validated at true', async () => {
    const marcelDupontModel = getMarcelDupontModel('nomination-file-id', 1, {
      folderNumber: 1,
      reporters: ['   FIRST Reporter  ', '   SECOND Reporter  '],
      observers: [anObserverString, '  SECOND OBSERVER  '],
      transparency: Transparency.AUTOMNE_2024,
      biography: ' - blabla ',
      formation: Magistrat.Formation.SIEGE,
    });

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModel(marcelDupontModel)
        .with('folderNumber', ' 1  ' as unknown as number)
        .with('transparency', ' Automne 2024 ')
        .with('biography', ' - blabla ')
        .withFormation(' Siège ')
        .with('dueDate', ' 10/11/2024 ')
        .with('birthDate', ' 01/11/1961 ')
        .build(),
    );

    const marcelDupontSnapshot = marcelDupontModel.toSnapshot();
    expectNominationFiles(
      new NominationFileModel(
        'nomination-file-id',
        dateTimeProvider.currentDate,
        {
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
        },
      ),
    );
  });

  it('parses a line with possible empty values unfilled and one rule pre-validated at true', async () => {
    const marcelDupontModel = getMarcelDupontModel('nomination-file-id', 1, {
      folderNumber: null,
      reporters: null,
      observers: null,
      biography: null,
    });
    await importAFile(
      new NominationFileTsvBuilder().fromModel(marcelDupontModel).build(),
    );
    expectNominationFiles(marcelDupontModel);
  });

  it('saves two lines', async () => {
    const marcelDupontModel = getMarcelDupontModel('nomination-file-id', 1);
    const lucienPierreModel = getLucienPierreModel(
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
        .fromModel(marcelDupontModel)
        .fromModel(lucienPierreModel)
        .build(),
    );

    expectNominationFiles(marcelDupontModel, lucienPierreModel);
  });

  describe('when an updated file is imported a second time', () => {
    beforeEach(() => {
      nominationFileRepository.nominationFiles = {
        'nomination-file-id': getFirstRow(),
        'another-id': getMarcelDupontModel('another-id', 2),
      };
      uuidGenerator.nextUuids = [
        'lucien-nomination-file-id',
        nominationFilesImportedEventId,
        nominationFilesUpdatedEventId,
      ];
    });

    it("doesn't inform about a new file imported if no new line", async () => {
      await importAFile(
        new NominationFileTsvBuilder().fromModel(getFirstRow()).build(),
      );
      expect(domainEventRepository).toHaveDomainEvents();
    });

    it.each<{
      changedEntry: string;
      getTsvValue: () => string;
      getEventPayload: () => NominationFilesUpdatedEventPayload;
    }>([
      {
        changedEntry: 'observers',
        getTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModel(
              getMarcelDupontModel('nomination-file-id', 1, {
                observers: [anObserverString],
              }),
            )
            .build(),
        getEventPayload: () => [
          {
            nominationFileId: 'nomination-file-id',
            content: {
              observers: getMarcelDupontRead(1, {
                observers: [anObserverExpected],
              }).content.observers,
            },
          },
        ],
      },
      {
        changedEntry: 'rules',
        getTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModel(
              getMarcelDupontModel('nomination-file-id', 1, {
                rules: {
                  [NominationFile.RuleGroup.MANAGEMENT]: {
                    [NominationFile.ManagementRule.TRANSFER_TIME]: false,
                  },
                },
              }),
            )
            .build(),
        getEventPayload: () => [
          {
            nominationFileId: 'nomination-file-id',
            content: {
              rules: getMarcelDupontRead(1, {
                rules: {
                  [NominationFile.RuleGroup.MANAGEMENT]: {
                    [NominationFile.ManagementRule.TRANSFER_TIME]: false,
                  },
                },
              }).content.rules,
            },
          },
        ],
      },
    ])(
      'informs about an update on $changedEntry',
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
          .fromModel(getFirstRow())
          .withRuleTransferTime('FALSE')
          .fromModel(getMarcelDupontModel('another-id', 2))
          .build(),
      );
      expect(nominationFileRepository.save).toHaveBeenCalledTimes(1);
    });

    const udatedRulesTestData: Array<{
      ruleName: string;
      genTsvValue: () => string;
      getExpectedNominationFile: () => NominationFileModel;
    }> = [
      {
        ruleName: 'Transfer Time',
        genTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModel(getFirstRow())
            .withRuleTransferTime('FALSE')
            .build(),
        getExpectedNominationFile: () =>
          getMarcelDupontModel('nomination-file-id', 1, {
            rules: {
              [NominationFile.RuleGroup.MANAGEMENT]: {
                [NominationFile.ManagementRule.TRANSFER_TIME]: false,
              },
            },
          }),
      },
      {
        ruleName: 'Minister Cabinet',
        genTsvValue: () =>
          new NominationFileTsvBuilder()
            .fromModel(getFirstRow())
            .withRuleMinisterCabinet('FALSE')
            .build(),
        getExpectedNominationFile: () =>
          getMarcelDupontModel('nomination-file-id', 1, {
            rules: {
              [NominationFile.RuleGroup.STATUTORY]: {
                [NominationFile.StatutoryRule.MINISTER_CABINET]: false,
              },
            },
          }),
      },
    ];

    it.each(udatedRulesTestData)(
      'updates the $ruleName rule',
      async ({ genTsvValue, getExpectedNominationFile }) => {
        await importAFile(genTsvValue());
        expectNominationFiles(
          getExpectedNominationFile(),
          getMarcelDupontModel('another-id', 2),
        );
      },
    );

    it.each`
      field                  | updatedContent
      ${'name'}              | ${{ name: 'Other Name' }}
      ${'formation'}         | ${{ formation: Magistrat.Formation.SIEGE }}
      ${'state'}             | ${{ state: NominationFile.ReportState.OPINION_RETURNED }}
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
          .fromModel(
            getMarcelDupontModel('nomination-file-id', 1, updatedContent),
          )
          .build(),
      );
      expectNominationFiles(
        getFirstRow(),
        getMarcelDupontModel('another-id', 2),
      );
    });

    it('imports only the new line', async () => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModel(getFirstRow())
          .fromModel(getMarcelDupontModel('another-id', 2))
          .fromModel(getLucienPierreModel('lucien-nomination-file-id', 3))
          .build(),
      );
      expectNominationFiles(
        getFirstRow(),
        getMarcelDupontModel('another-id', 2),
        getLucienPierreModel('lucien-nomination-file-id', 3),
      );
    });

    const getFirstRow = () => getMarcelDupontModel('nomination-file-id', 1);
  });

  const importAFile = (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      nominationFileRepository,
      dateTimeProvider,
      uuidGenerator,
      transactionPerformer,
      domainEventRepository,
    ).execute(fileToImport);

  const expectNominationFiles = (...nominationFiles: NominationFileModel[]) => {
    expect(nominationFileRepository.nominationFiles).toEqual<
      FakeNominationFileRepository['nominationFiles']
    >(
      nominationFiles.reduce(
        (acc, nominationFile) => ({
          ...acc,
          [nominationFile.toSnapshot().id]: nominationFile,
        }),
        {},
      ),
    );
  };

  const getMarcelDupontModel = (
    uuid: string,
    rowNumber = 1,
    moreContent?: PartialDeep<NominationFileRead['content']>,
  ): NominationFileModel =>
    new NominationFileModel(
      uuid,
      dateTimeProvider.currentDate,
      getMarcelDupontRead(rowNumber, moreContent),
    );

  const getLucienPierreModel = (
    uuid: string,
    rowNumber = 1,
  ): NominationFileModel =>
    new NominationFileModel(
      uuid,
      dateTimeProvider.currentDate,
      getLucienPierreRead(rowNumber),
    );

  const getMarcelDupontRead = (
    rowNumber = 1,
    moreContent?: PartialDeep<
      Omit<NominationFileRead['content'], 'dueDate' | 'birthDate'>
    >,
  ): NominationFileRead => ({
    rowNumber,
    content: {
      folderNumber: 1,
      name: 'Marcel Dupont Ep. François',
      formation: Magistrat.Formation.SIEGE,
      dueDate: {
        year: 2024,
        month: 11,
        day: 10,
      },
      state: NominationFile.ReportState.NEW,
      transparency: Transparency.AUTOMNE_2024,
      reporters: [
        'LUC Loïc',
        'ÉMILIEN-RENAUD Jules ep. Françoise',
        'JEANNE LOUISE DE FRANCE Aude',
      ],
      grade: Magistrat.Grade.I,
      currentPosition: 'Avocat général - service extraordinaire CC  PARIS',
      targettedPosition: 'Premier avocat général CC  PARIS - HH',
      rank: '(2 sur une liste de 2)',
      birthDate: {
        year: 1961,
        month: 11,
        day: 1,
      },
      biography: '- blablablablabla',
      observers: ['DEFAULT Observer'],

      ...moreContent,
      rules: getReadRules(moreContent?.rules),
    },
  });

  const getLucienPierreRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
      folderNumber: 2,
      name: 'Lucien Pierre',
      formation: Magistrat.Formation.PARQUET,
      dueDate: null,
      state: NominationFile.ReportState.OPINION_RETURNED,
      transparency: Transparency.AUTOMNE_2024,
      reporters: null,
      grade: Magistrat.Grade.HH,
      currentPosition: 'Procureur de la République adjoint TJ  NIMES',
      targettedPosition: 'Avocat général CC  PARIS - HH',
      rank: '2 sur une liste de 11)',
      birthDate: {
        year: 1962,
        month: 8,
        day: 22,
      },
      biography: '- blablablablabla',
      observers: null,
      rules: getReadRules({
        [NominationFile.RuleGroup.STATUTORY]: {
          [NominationFile.StatutoryRule.MINISTER_CABINET]: true,
        },
      }),
    },
  });
});

export const getReadRules = (
  moreRules?: PartialDeep<NominationFileRead['content']['rules']>,
): NominationFileRead['content']['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.MANAGEMENT]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(
    NominationFile.StatutoryRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.STATUTORY]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: moreRules?.[NominationFile.RuleGroup.QUALITATIVE]?.[rule] ?? true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
