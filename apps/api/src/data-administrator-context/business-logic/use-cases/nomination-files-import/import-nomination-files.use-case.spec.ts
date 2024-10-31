import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileRepository } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { EmptyFileError } from '../../errors/empty-file.error';
import { FileLengthTooShortError } from '../../errors/file-length-too-short.error';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';
import { NominationFileModel } from '../../models/nomination-file';
import { NominationFilesImportedEvent } from '../../models/nomination-file-imported.event';
import { NominationFileRead } from '../../models/nomination-file-read';
import { NominationFileTsvBuilder } from '../../models/nomination-file-tsv-builder';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';

const nominationFilesImportedEventId = 'nomination-files-imported-event-id';

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

  it('rejects all imports if one has note the expected rules count', async () => {
    await expect(
      importAFile(
        new NominationFileTsvBuilder()
          .fromModel(getMarcelDupontModel('nomination-file-id', 1))
          .withRuleMinisterCabinet('FFALSE')
          .build(),
      ),
    ).rejects.toThrow(InvalidRowValueError);
  });

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
    const marcelDupontModel = getMarcelDupontModel('nomination-file-id', 1);
    await importAFile(
      new NominationFileTsvBuilder().fromModel(marcelDupontModel).build(),
    );
    await expectNominationFiles(marcelDupontModel);
  });

  it('parses a line with possible empty values unfilled and one rule pre-validated at true', async () => {
    const lucienPierreModel = getLucienPierreModel('nomination-file-id', 1);
    await importAFile(
      new NominationFileTsvBuilder().fromModel(lucienPierreModel).build(),
    );
    await expectNominationFiles(lucienPierreModel);
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

    await expectNominationFiles(marcelDupontModel, lucienPierreModel);
  });

  describe('when a first import is done', () => {
    beforeEach(async () => {
      nominationFileRepository.nominationFiles = {
        'nomination-file-id': getMarcelDupontModel('nomination-file-id', 1),
      };
      uuidGenerator.nextUuids = [
        'second-nomination-file-id',
        nominationFilesImportedEventId,
      ];
    });

    it('imports only the new line in a second import', async () => {
      await importAFile(
        new NominationFileTsvBuilder()
          .fromModel(getMarcelDupontModel('nomination-file-id', 1))
          .fromModel(getLucienPierreModel('second-nomination-file-id', 2))
          .build(),
      );
      await expectNominationFiles(
        getMarcelDupontModel('nomination-file-id', 1),
        getLucienPierreModel('second-nomination-file-id', 2),
      );
    });
  });

  const importAFile = (fileToImport: string) =>
    new ImportNominationFilesUseCase(
      nominationFileRepository,
      dateTimeProvider,
      uuidGenerator,
      transactionPerformer,
      domainEventRepository,
    ).execute(fileToImport);

  const expectNominationFiles = async (
    ...nominationFiles: NominationFileModel[]
  ) =>
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

  const getMarcelDupontModel = (
    uuid: string,
    rowNumber = 1,
  ): NominationFileModel =>
    new NominationFileModel(
      uuid,
      dateTimeProvider.currentDate,
      null,
      getMarcelDupontRead(rowNumber),
    );

  const getLucienPierreModel = (
    uuid: string,
    rowNumber = 1,
  ): NominationFileModel =>
    new NominationFileModel(
      uuid,
      dateTimeProvider.currentDate,
      null,
      getLucienPierreRead(rowNumber),
    );

  const getMarcelDupontRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
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
      rules: getAllRulesPreValidated(),
    },
  });

  const getLucienPierreRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
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
      rules: getAllRulesPreValidated({ exceptRuleMinisterCabinet: true }),
    },
  });
});

export const getAllRulesPreValidated = (options?: {
  exceptRuleMinisterCabinet: true;
}): NominationFileRead['content']['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(
    NominationFile.StatutoryRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]:
        options?.exceptRuleMinisterCabinet &&
        rule === NominationFile.StatutoryRule.MINISTER_CABINET
          ? false
          : true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({ ...acc, [rule]: true }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
