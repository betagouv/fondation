import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { EncryptionProvider } from '../gateways/providers/encryption.provider';

export class DomainRegistry {
  private static uuidGeneratorService: UuidGenerator;
  private static dateTimeProviderService: DateTimeProvider;
  private static encryptionProviderService: EncryptionProvider;

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

  static setEncryptionProvider(service: EncryptionProvider) {
    DomainRegistry.encryptionProviderService = service;
  }
  static encryptionProvider() {
    if (!DomainRegistry.encryptionProviderService) {
      throw new Error('EncryptionProvider is not set');
    }
    return DomainRegistry.encryptionProviderService;
  }
}
