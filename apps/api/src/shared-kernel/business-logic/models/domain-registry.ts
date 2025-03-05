import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';

export abstract class DomainRegistry {
  private static uuidGeneratorService: UuidGenerator;
  private static dateTimeProviderService: DateTimeProvider;

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
}
