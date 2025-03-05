import { DomainRegistry as SharedKernelDomainRegistry } from 'src/shared-kernel/business-logic/models/domain-registry';
import { EncryptionProvider } from '../gateways/providers/encryption.provider';

export class DomainRegistry extends SharedKernelDomainRegistry {
  private static encryptionProviderService: EncryptionProvider;

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
