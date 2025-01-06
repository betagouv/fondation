import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { RegisterUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { SqlUserRepository } from '../../secondary/gateways/repositories/drizzle/sql-user.repository';
import { generateIdentityAndAccessProvider as generateProvider } from './provider-generator';
import { ENCRYPTION_PROVIDER, USER_REPOSITORY } from './tokens';
import {
  DATE_TIME_PROVIDER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DomainRegistry } from 'src/identity-and-access-context/business-logic/models/domain-registry';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { BcryptEncryptionProvider } from '../../secondary/gateways/providers/bcrypt-encryption.provider';
import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';

@Module({
  imports: [SharedKernelModule],
  providers: [
    generateProvider(SqlUserRepository, [], USER_REPOSITORY),
    generateProvider(RegisterUserUseCase, [
      'TRANSACTION_PERFORMER',
      'DOMAIN_EVENT_REPOSITORY',
      USER_REPOSITORY,
    ]),
    generateProvider(BcryptEncryptionProvider, [], ENCRYPTION_PROVIDER),
  ],
})
export class IdentityAndAccessModule implements OnModuleInit {
  constructor(
    @Inject(UUID_GENERATOR)
    private readonly uuidGenerator: UuidGenerator,
    @Inject(DATE_TIME_PROVIDER)
    private readonly dateTimeProvider: DateTimeProvider,
    @Inject(ENCRYPTION_PROVIDER)
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  onModuleInit() {
    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    DomainRegistry.setDateTimeProvider(this.dateTimeProvider);
    DomainRegistry.setEncryptionProvider(this.encryptionProvider);
  }
}
