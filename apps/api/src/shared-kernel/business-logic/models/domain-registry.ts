import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';

export abstract class DomainRegistry {
  private static uuidGeneratorService: UuidGenerator;
  private static dateTimeProviderService: DateTimeProvider;
  private static domainEventRepositoryService: DomainEventRepository;

  static setUuidGenerator(service: UuidGenerator) {
    DomainRegistry.uuidGeneratorService = service;
  }
  static uuidGenerator(): UuidGenerator {
    if (!DomainRegistry.uuidGeneratorService) {
      throw new Error('UuidGenerator is not set');
    }
    return DomainRegistry.uuidGeneratorService;
  }

  static setDateTimeProvider(service: DateTimeProvider) {
    DomainRegistry.dateTimeProviderService = service;
  }
  static dateTimeProvider(): DateTimeProvider {
    if (!DomainRegistry.dateTimeProviderService) {
      throw new Error('DateTimeProvider is not set');
    }
    return DomainRegistry.dateTimeProviderService;
  }

  static setDomainEventRepository(repository: DomainEventRepository) {
    DomainRegistry.domainEventRepositoryService = repository;
  }
  static domainEventRepository(): Pick<DomainEventRepository, 'save'> {
    if (!DomainRegistry.domainEventRepositoryService) {
      throw new Error('DomainEventRepository is not set');
    }
    return DomainRegistry.domainEventRepositoryService;
  }
}
