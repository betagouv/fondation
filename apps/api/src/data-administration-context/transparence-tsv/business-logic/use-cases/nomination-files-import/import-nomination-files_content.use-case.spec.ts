import {
  Gender,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
} from 'shared-models';
import { FakeTransparenceRepository } from 'src/data-administration-context/transparence-tsv/adapters/secondary/gateways/repositories/fake-transparence.repository';
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
import { NominationFileModelSnapshot } from '../../models/nomination-file';
import {
  Line,
  NominationFileTsvBuilder,
} from '../../models/nomination-file-tsv-builder';
import { TransparenceSnapshot } from '../../models/transparence';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import {
  anObserverExpected,
  anObserverString,
  currentDate,
  emilienRenaudJulesUser,
  gdsTransparenceId,
  gdsTransparenceName,
  GetLucienPierreModelSnapshot,
  getLucienPierreModelSnapshotFactory,
  GetMarcelDupontModelSnapshot,
  getMarcelDupontModelSnapshotFactory,
  jeanneLouiseDeFranceAudeUser,
  lucLoïcUser,
  NominationFileReadRulesBuilder,
} from './import-nomination-files.use-case.fixtures';
import { FakeUserService } from 'src/data-administration-context/transparence-tsv/adapters/secondary/gateways/services/fake-user.service';

const nominationFilesImportedEventId = 'nomination-files-imported-event-id';
const nominationFilesUpdatedEventId = 'nomination-files-updated-event-id';

describe('Import Nomination Files Use Case', () => {
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let transactionPerformer: TransactionPerformer;
  let transparenceRepository: FakeTransparenceRepository;
  let userService: FakeUserService;
  let getMarcelDupontModelSnapshot: GetMarcelDupontModelSnapshot;
  let getLucienPierreModelSnapshot: GetLucienPierreModelSnapshot;

  beforeEach(() => {
    domainEventRepository = new FakeDomainEventRepository();
    transactionPerformer = new NullTransactionPerformer();
    transparenceRepository = new FakeTransparenceRepository();
    userService = new FakeUserService();
    userService.addUsers(
      lucLoïcUser,
      emilienRenaudJulesUser,
      jeanneLouiseDeFranceAudeUser,
    );
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [
      'nomination-file-id',
      gdsTransparenceId,
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
    userService.addUsers(
      {
        userId: 'reporter-id',
        firstName: 'FIRST',
        lastName: 'Reporter',
        fullName: 'FIRST Reporter',
        role: Role.MEMBRE_COMMUN,
        gender: Gender.M,
      },
      {
        userId: 'second-reporter-id',
        firstName: 'SECOND',
        lastName: 'Reporter',
        fullName: 'SECOND Reporter',
        role: Role.MEMBRE_COMMUN,
        gender: Gender.M,
      },
    );
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

    expectTransparences(
      uneTranspaSiègeAvecDossiers({
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
      }),
    );
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
    expectTransparences(uneTranspaSiègeAvecDossiers(marcelDupontModelSnapshot));
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
      gdsTransparenceId,
      nominationFilesImportedEventId,

      'second-nomination-file-id',
      'gds-transparence-parquet-id',
      'parquet-event-id',
    ];

    await importAFile(
      new NominationFileTsvBuilder()
        .fromModelSnapshot(marcelDupontModel)
        .fromModelSnapshot(lucienPierreModel)
        .build(),
    );

    expectTransparences(uneTranspaSiègeAvecDossiers(marcelDupontModel), {
      id: 'gds-transparence-parquet-id',
      createdAt: currentDate,
      name: Transparency.AUTOMNE_2024,
      formation: Magistrat.Formation.PARQUET,
      nominationFiles: [lucienPierreModel],
    });
  });

  describe('when an updated file is imported a second time', () => {
    beforeEach(() => {
      transparenceRepository.addTransparence(gdsTransparenceId, {
        id: gdsTransparenceId,
        createdAt: dateTimeProvider.currentDate,
        name: gdsTransparenceName,
        formation: Magistrat.Formation.SIEGE,
        nominationFiles: [getFirstRow()],
      });
      transparenceRepository.addTransparence('gds-transparence-parquet-id', {
        id: 'gds-transparence-parquet-id',
        createdAt: currentDate,
        name: Transparency.AUTOMNE_2024,
        formation: Magistrat.Formation.PARQUET,
        nominationFiles: [getLucienPierreModelSnapshot('another-id', 2)],
      });

      uuidGenerator.nextUuids = [
        'third-nomination-file-id',
        nominationFilesImportedEventId,
        nominationFilesUpdatedEventId,
      ];
    });

    it('updates the observers', async () => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModelSnapshot(getFirstRow())
          .fromModelSnapshot(getLucienPierreModelSnapshot('another-id', 2))
          .with('observers', ['new observer'])
          .build(),
      );

      expectTransparences(
        uneTranspaSiègeAvecDossiers(getFirstRow()),
        uneTranspaParquetAvecDossiers(
          getLucienPierreModelSnapshot('another-id', 2, {
            observers: ['new observer'],
          }),
        ),
      );
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
        expectTransparences(
          uneTranspaSiègeAvecDossiers(getExpectedNominationFile()),
          uneTranspaParquetAvecDossiers(
            getLucienPierreModelSnapshot('another-id', 2),
          ),
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
      expectTransparences(
        uneTranspaSiègeAvecDossiers(getFirstRow()),
        uneTranspaParquetAvecDossiers(
          getLucienPierreModelSnapshot('another-id', 2),
        ),
      );
    });

    it('imports only the new line', async () => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModelSnapshot(getFirstRow())
          .fromModelSnapshot(getLucienPierreModelSnapshot('another-id', 2))
          .fromModelSnapshot(
            getMarcelDupontModelSnapshot('third-nomination-file-id', 3),
          )
          .build(),
      );
      expectTransparences(
        uneTranspaSiègeAvecDossiers(
          getFirstRow(),
          getMarcelDupontModelSnapshot('third-nomination-file-id', 3),
        ),
        uneTranspaParquetAvecDossiers(
          getLucienPierreModelSnapshot('another-id', 2),
        ),
      );
    });

    const getFirstRow = () =>
      getMarcelDupontModelSnapshot('nomination-file-id', 1);
  });

  const importAFile = (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      transactionPerformer,
      new TransparenceService(
        domainEventRepository,
        transparenceRepository,
        userService,
      ),
    ).execute(fileToImport);

  const expectTransparences = (...transparences: TransparenceSnapshot[]) => {
    expect(transparenceRepository.getTransparences()).toEqual<
      TransparenceSnapshot[]
    >(transparences);
  };
});

const uneTranspaSiègeAvecDossiers = (
  ...nominationFileSnapshots: NominationFileModelSnapshot[]
): TransparenceSnapshot => ({
  id: gdsTransparenceId,
  createdAt: currentDate,
  name: gdsTransparenceName,
  formation: Magistrat.Formation.SIEGE,
  nominationFiles: nominationFileSnapshots,
});

const uneTranspaParquetAvecDossiers = (
  ...nominationFileSnapshots: NominationFileModelSnapshot[]
): TransparenceSnapshot => ({
  id: 'gds-transparence-parquet-id',
  createdAt: currentDate,
  name: Transparency.AUTOMNE_2024,
  formation: Magistrat.Formation.PARQUET,
  nominationFiles: nominationFileSnapshots,
});
