import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileRepository } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { NominationFileModel } from '../../models/nomination-file';
import { NominationFileRead } from '../../models/nomination-file-read';
import { SetReportIdUseCase } from './set-report-id.use-case';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { getAllRulesPreValidated } from '../nomination-files-import/import-nomination-files.use-case.spec';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/providers/deterministic-date-provider';

const reportId = 'report-id';
const nominationFileId = 'nomination-file-id';

describe('Set Report Id Use Case', () => {
  let transactionPerformer: TransactionPerformer;
  let fakeNominationFileRepository: FakeNominationFileRepository;
  let nominationFile: NominationFileModel;
  let dateTimeProvider: DeterministicDateProvider;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();
    fakeNominationFileRepository = new FakeNominationFileRepository();
    dateTimeProvider = new DeterministicDateProvider();

    nominationFile = getLucienPierreModel(nominationFileId);
    fakeNominationFileRepository.nominationFiles = {
      [nominationFileId]: nominationFile,
    };
  });

  it('should set the report id', async () => {
    await new SetReportIdUseCase(
      transactionPerformer,
      fakeNominationFileRepository,
    ).execute(nominationFileId, reportId);

    expectNominationFiles(nominationFile);
  });

  const expectNominationFiles = (...nominationFiles: NominationFileModel[]) => {
    const expectedNominationFiles = nominationFiles.reduce(
      (acc, nominationFile) => {
        const nominationFileSnapshot = nominationFile.toSnapshot();

        return {
          ...acc,
          [nominationFileSnapshot.id]: new NominationFileModel(
            nominationFileSnapshot.id,
            dateTimeProvider.currentDate,
            reportId,
            {
              rowNumber: nominationFileSnapshot.rowNumber,
              content: nominationFileSnapshot.content,
            },
          ),
        };
      },
      {},
    );

    expect(fakeNominationFileRepository.nominationFiles).toEqual(
      expectedNominationFiles,
    );
  };

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

  const getLucienPierreRead = (rowNumber = 1): NominationFileRead => ({
    rowNumber,
    content: {
      name: 'Lucien Pierre',
      formation: Magistrat.Formation.PARQUET,
      dueDate: null,
      state: NominationFile.ReportState.OPINION_RETURNED,
      transparency: Transparency.AUTOMNE_2024,
      reporters: ['VICTOIRE Christian'],
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
