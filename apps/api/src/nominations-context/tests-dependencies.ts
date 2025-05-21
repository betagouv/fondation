import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeSessionRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { FakeUserService } from 'src/nominations-context/adapters/secondary/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from './business-logic/models/domain-registry';
import { TransparenceService } from './business-logic/services/transparence.service';
import { GetDossierDeNominationSnapshotUseCase } from './business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { GetSessionSnapshotUseCase } from './business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';
import { ImportNouveauxDossiersTransparenceUseCase } from './business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';
import { ImportNouvelleTransparenceUseCase } from './business-logic/use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { UpdateDossierDeNominationUseCase } from './business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';

export const currentDate = new Date(2024, 10, 10);

export const getDependencies = () => {
  const affectationRepository = new FakeAffectationRepository();
  const sessionRepository = new FakeSessionRepository();
  const dossierDeNominationRepository = new FakeDossierDeNominationRepository();
  const domainEventRepository = new FakeDomainEventRepository();
  const préAnalyseRepository = new FakePréAnalyseRepository();
  const nullTransactionPerformer = new NullTransactionPerformer();

  const transparenceService = new TransparenceService(
    dossierDeNominationRepository,
    préAnalyseRepository,
    sessionRepository,
    affectationRepository,
    domainEventRepository,
  );

  const uuidGenerator = new DeterministicUuidGenerator();
  DomainRegistry.setUuidGenerator(uuidGenerator);

  const dateTimeProvider = new DeterministicDateProvider();
  dateTimeProvider.currentDate = currentDate;
  DomainRegistry.setDateTimeProvider(dateTimeProvider);

  const userService = new FakeUserService();

  const importNouvelleTransparenceUseCase =
    new ImportNouvelleTransparenceUseCase(
      nullTransactionPerformer,
      transparenceService,
    );

  const updateDossierDeNominationUseCase = new UpdateDossierDeNominationUseCase(
    nullTransactionPerformer,
    dossierDeNominationRepository,
    préAnalyseRepository,
  );

  const importNouveauxDossiersTransparenceUseCase =
    new ImportNouveauxDossiersTransparenceUseCase(
      nullTransactionPerformer,
      sessionRepository,
      transparenceService,
    );

  const getDossierDeNominationSnapshotUseCase =
    new GetDossierDeNominationSnapshotUseCase(
      dossierDeNominationRepository,
      nullTransactionPerformer,
    );
  const getSessionSnapshotUseCase = new GetSessionSnapshotUseCase(
    sessionRepository,
    nullTransactionPerformer,
  );

  return {
    nullTransactionPerformer,
    uuidGenerator,
    dateTimeProvider,
    affectationRepository,
    sessionRepository,
    dossierDeNominationRepository,
    transparenceService,
    userService,
    domainEventRepository,
    préAnalyseRepository,
    importNouvelleTransparenceUseCase,
    updateDossierDeNominationUseCase,
    importNouveauxDossiersTransparenceUseCase,
    getDossierDeNominationSnapshotUseCase,
    getSessionSnapshotUseCase,
  };
};
