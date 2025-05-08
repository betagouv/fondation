import { Magistrat, NominationFile } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import {
  CreateReportCommand,
  CreateReportUseCase,
} from './create-report.use-case';

describe('Create Report Use Case', () => {
  let reportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportRuleRepository: FakeReportRuleRepository;
  let datetimeProvider: DeterministicDateProvider;

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    transactionPerformer = new NullTransactionPerformer();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [nominationFileReportId];
    reportRuleRepository = new FakeReportRuleRepository();
    datetimeProvider = new DeterministicDateProvider();
    datetimeProvider.currentDate = new Date(2021, 8, 22);

    DomainRegistry.setReportRuleRepository(reportRuleRepository);
    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(datetimeProvider);
  });

  it('crée un rapport', async () => {
    await createAReport(uneCommande);

    expectReports({
      id: nominationFileReportId,
      createdAt: datetimeProvider.currentDate,
      dossierDeNominationId: importedNominationFileId,
      sessionId: uneSessionId,
      formation: uneFormation,
      reporterId: userId,
      version: 0,
      state: NominationFile.ReportState.NEW,
      comment: null,
      attachedFiles: null,
    });
  });

  it('retries the transaction if it fails', async () => {
    uuidGenerator.nextUuids = [
      nominationFileReportId,
      nominationFileReportId,
      nominationFileReportId,
    ];

    reportRepository.saveError = new Error('Save report failed');
    reportRepository.saveErrorCountLimit = 2;

    await createAReport(uneCommande);

    expect(reportRepository.saveErrorCount).toBe(2);
    expectReports({
      id: nominationFileReportId,
      createdAt: datetimeProvider.currentDate,
      dossierDeNominationId: importedNominationFileId,
      sessionId: uneSessionId,
      formation: uneFormation,
      reporterId: userId,
      version: 0,
      state: NominationFile.ReportState.NEW,
      comment: null,
      attachedFiles: null,
    });
  });

  const createAReport = (command: CreateReportCommand) =>
    new CreateReportUseCase(reportRepository, transactionPerformer).execute(
      command,
    );

  const expectReports = (...reports: NominationFileReportSnapshot[]) => {
    expect(Object.values(reportRepository.reports)).toEqual(reports);
  };
});

const nominationFileReportId = 'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';
const importedNominationFileId = 'imported-nomination-file-id';
const userId = 'reporter-id';
const uneSessionId = 'une-session-id';
const uneFormation = Magistrat.Formation.PARQUET;

const uneCommande = CreateReportCommand.create({
  dossierDeNominationId: importedNominationFileId,
  sessionId: uneSessionId,
  formation: uneFormation,
  rapporteurId: userId,
});
