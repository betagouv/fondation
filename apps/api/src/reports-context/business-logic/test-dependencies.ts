import { Role } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportListingVMRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-listing-vm.repository';
import { FakeReportRetrievalVMQuery } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { ReporterTranslatorService } from '../adapters/secondary/gateways/services/reporter-translator.service';
import { StubDossierDeNominationService } from '../adapters/secondary/gateways/services/stub-dossier-de-nomination.service';
import { StubSessionService } from '../adapters/secondary/gateways/services/stub-session.service';
import { StubUserService } from '../adapters/secondary/gateways/services/stub-user.service';
import { DomainRegistry } from './models/domain-registry';
import { CréerAnalyseUseCase } from './use-cases/création-analyse/créer-analyse.use-case';
import { CreateReportUseCase } from './use-cases/report-creation/create-report.use-case';
import { RetrieveReportUseCase } from './use-cases/report-retrieval/retrieve-report.use-case';
import { FakeReportFileService } from '../adapters/secondary/gateways/services/fake-report-file-service';
import { UploadReportFilesUseCase } from './use-cases/report-files-upload/upload-report-files';
import { DossierDeNominationTranslator } from '../adapters/secondary/gateways/services/dossier-de-nomination.translator';

export const currentDate = new Date(2024, 10, 10);

const unUserId = 'un-user-id';
export const unRapporteur = {
  userId: unUserId,
  firstName: 'Loïc',
  lastName: 'LUC',
  role: Role.MEMBRE_COMMUN,
};
export const getDependencies = () => {
  const nullTransactionPerformer = new NullTransactionPerformer();
  const uuidGenerator = new DeterministicUuidGenerator();
  const dateTimeProvider = new DeterministicDateProvider();

  dateTimeProvider.currentDate = currentDate;
  DomainRegistry.setUuidGenerator(uuidGenerator);
  DomainRegistry.setDateTimeProvider(dateTimeProvider);

  const fakeReportRepository = new FakeNominationFileReportRepository();
  const fakeReportRuleRepository = new FakeReportRuleRepository();
  DomainRegistry.setReportRuleRepository(fakeReportRuleRepository);
  const fakeReportListingVMQuery = new FakeReportListingVMRepository();
  const fakeReportRetrievalVMQuery = new FakeReportRetrievalVMQuery();
  const fakeDomainEventRepository = new FakeDomainEventRepository();

  const stubUserService = new StubUserService();
  const reporterTranslatorService = new ReporterTranslatorService(
    stubUserService,
  );
  const stubDossierDeNominationService = new StubDossierDeNominationService();
  const stubSessionService = new StubSessionService();
  const fakeReportFileService = new FakeReportFileService();

  const createReportUseCase = new CreateReportUseCase(
    fakeReportRepository,
    fakeDomainEventRepository,
  );
  const créerAnalyseUseCase = new CréerAnalyseUseCase(nullTransactionPerformer);
  const retrieveReportUseCase = new RetrieveReportUseCase(
    fakeReportRetrievalVMQuery,
    stubSessionService,
    stubDossierDeNominationService,
  );
  const uploadReportFilesUseCase = new UploadReportFilesUseCase(
    fakeReportFileService,
    nullTransactionPerformer,
    fakeReportRepository,
    reporterTranslatorService,
    new DossierDeNominationTranslator(
      stubDossierDeNominationService,
      stubSessionService,
    ),
  );

  return {
    nullTransactionPerformer,
    uuidGenerator,
    dateTimeProvider,

    fakeReportRepository,
    fakeReportRuleRepository,
    fakeReportListingVMQuery,
    fakeReportRetrievalVMQuery,
    fakeDomainEventRepository,

    stubUserService,
    reporterTranslatorService,
    stubDossierDeNominationService,
    stubSessionService,
    fakeReportFileService,

    createReportUseCase,
    créerAnalyseUseCase,
    retrieveReportUseCase,
    uploadReportFilesUseCase,
  };
};
