import { FakeAffectationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-affectation.repository';
import { FakeDossierDeNominationRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeSessionRepository } from 'src/nominations-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { FakeUserService } from 'src/nominations-context/adapters/secondary/services/fake-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainRegistry } from '../models/domain-registry';
import { TransparenceService } from '../services/transparence.service';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';

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
  };
};
