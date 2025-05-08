import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportListingVMRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-listing-vm.repository';
import { FakeReportRetrievalVMQuery } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from './models/domain-registry';
import { StubUserService } from '../adapters/secondary/gateways/services/stub-user.service';
import { Role } from 'shared-models';
import { ReporterTranslatorService } from '../adapters/secondary/gateways/services/reporter-translator.service';
import { CreateReportUseCase } from './use-cases/report-creation/create-report.use-case';
import { StubDossierDeNominationService } from '../adapters/secondary/gateways/services/stub-dossier-de-nomination.service';
import { StubSessionService } from '../adapters/secondary/gateways/services/stub-session.service';
import { CréerAnalyseUseCase } from './use-cases/création-analyse/créer-analyse.use-case';

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

  const createReportUseCase = new CreateReportUseCase(
    fakeReportRepository,
    fakeDomainEventRepository,
  );
  const créerAnalyseUseCase = new CréerAnalyseUseCase(nullTransactionPerformer);

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

    createReportUseCase,
    créerAnalyseUseCase,
  };
};
