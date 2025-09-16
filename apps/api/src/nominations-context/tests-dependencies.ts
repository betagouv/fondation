import { TypeDeSaisine } from 'shared-models';
import { FakeAffectationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeSessionRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/fake-session.repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { GetDossierDeNominationSnapshotUseCase } from './dossier-de-nominations/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { FakeTransparenceRepository } from './pp-gds/transparences/adapters/secondary/gateways/repositories/fake-transparence.repository';
import { TransparenceService } from './pp-gds/transparences/business-logic/services/transparence.service';
import { GetTransparenceSnapshotUseCase } from './pp-gds/transparences/business-logic/use-cases/get-transparence-snapshot/get-transparence-snapshot.use-case';
import { ImportNouveauxDossiersTransparenceUseCase } from './pp-gds/transparences/business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';
import { ImportNouvelleTransparenceXlsxUseCase } from './pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence-xlsx/import-nouvelle-transparence-xlsx.use-case';
import { ImportNouvelleTransparenceUseCase } from './pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { UpdateDossierDeNominationUseCase } from './pp-gds/transparences/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';
import { UpdateObservantsUseCase } from './pp-gds/transparences/business-logic/use-cases/update-observants/update-observants.use-case';
import { DomainRegistry } from './sessions/business-logic/models/domain-registry';
import { GetSessionSnapshotUseCase } from './sessions/business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';

export const currentDate = new Date(2024, 10, 10);

export const getDependencies = () => {
  const affectationRepository = new FakeAffectationRepository();
  const sessionRepository = new FakeSessionRepository();
  const dossierDeNominationRepository = new FakeDossierDeNominationRepository();
  const propropositionDeNominationTransparenceRepository =
    new FakeDossierDeNominationRepository<TypeDeSaisine.TRANSPARENCE_GDS>();
  const domainEventRepository = new FakeDomainEventRepository();
  const préAnalyseRepository = new FakePréAnalyseRepository();
  const fakeTransparenceRepository = new FakeTransparenceRepository();

  const nullTransactionPerformer = new NullTransactionPerformer();

  const transparenceService = new TransparenceService(
    propropositionDeNominationTransparenceRepository,
    sessionRepository,
    affectationRepository,
    domainEventRepository,
  );

  const uuidGenerator = new DeterministicUuidGenerator();
  DomainRegistry.setUuidGenerator(uuidGenerator);

  const dateTimeProvider = new DeterministicDateProvider();
  dateTimeProvider.currentDate = currentDate;
  DomainRegistry.setDateTimeProvider(dateTimeProvider);

  const importNouvelleTransparenceUseCase =
    new ImportNouvelleTransparenceUseCase(
      nullTransactionPerformer,
      transparenceService,
    );

  const importNouvelleTransparenceXlsxUseCase =
    new ImportNouvelleTransparenceXlsxUseCase(
      nullTransactionPerformer,
      transparenceService,
    );

  const updateDossierDeNominationUseCase = new UpdateDossierDeNominationUseCase(
    nullTransactionPerformer,
    propropositionDeNominationTransparenceRepository,
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
  const getTransparenceSnapshotUseCase = new GetTransparenceSnapshotUseCase(
    fakeTransparenceRepository,
    nullTransactionPerformer,
  );
  const updateObservantsUseCase = new UpdateObservantsUseCase(
    nullTransactionPerformer,
    dossierDeNominationRepository,
  );

  return {
    nullTransactionPerformer,
    uuidGenerator,
    dateTimeProvider,
    affectationRepository,
    sessionRepository,
    dossierDeNominationRepository,
    propropositionDeNominationTransparenceRepository,
    fakeTransparenceRepository,
    transparenceService,
    domainEventRepository,
    préAnalyseRepository,
    importNouvelleTransparenceUseCase,
    importNouvelleTransparenceXlsxUseCase,
    updateDossierDeNominationUseCase,
    importNouveauxDossiersTransparenceUseCase,
    getDossierDeNominationSnapshotUseCase,
    getSessionSnapshotUseCase,
    getTransparenceSnapshotUseCase,
    updateObservantsUseCase,
  };
};
