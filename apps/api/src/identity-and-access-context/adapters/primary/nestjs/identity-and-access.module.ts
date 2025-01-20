import {
  Inject,
  MiddlewareConsumer,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { CookieSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/hmac-signature.provider';
import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';
import { DomainRegistry } from 'src/identity-and-access-context/business-logic/models/domain-registry';
import { AuthenticationService } from 'src/identity-and-access-context/business-logic/services/authentication.service';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LogoutUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-logout/logout-user.use-case';
import { RegisterUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { UserWithFullNameUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-full-name/user-with-full-name.use-case';
import { UserWithIdUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-id/user-with-id.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { BcryptEncryptionProvider } from '../../secondary/gateways/providers/bcrypt-encryption.provider';
import { PersistentSessionProvider } from '../../secondary/gateways/providers/persistent-session.provider';
import { SqlSessionRepository } from '../../secondary/gateways/repositories/drizzle/sql-session.repository';
import { SqlUserRepository } from '../../secondary/gateways/repositories/drizzle/sql-user.repository';
import { AuthController, baseRoute, endpointsPaths } from './auth.controller';
import { generateIdentityAndAccessProvider as generateProvider } from './provider-generator';
import {
  ENCRYPTION_PROVIDER,
  SESSION_PROVIDER,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from './tokens';
import { SystemRequestValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/internal-request.middleware';

@Module({
  imports: [SharedKernelModule],
  controllers: [AuthController],
  providers: [
    generateProvider(ValidateSessionUseCase, [
      SESSION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(LoginUserUseCase, [
      SESSION_PROVIDER,
      TRANSACTION_PERFORMER,
      AuthenticationService,
    ]),
    generateProvider(RegisterUserUseCase, [USER_REPOSITORY]),
    generateProvider(LogoutUserUseCase, [
      SESSION_PROVIDER,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(UserWithFullNameUseCase, [
      USER_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(UserWithIdUseCase, [
      USER_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),

    generateProvider(AuthenticationService, [USER_REPOSITORY]),
    generateProvider(BcryptEncryptionProvider, [], ENCRYPTION_PROVIDER),
    generateProvider(
      PersistentSessionProvider,
      [SESSION_REPOSITORY],
      SESSION_PROVIDER,
    ),
    {
      provide: CookieSignatureProvider,
      useFactory: (apiConfig: ApiConfig) =>
        new CookieSignatureProvider(apiConfig),
      inject: [API_CONFIG],
    },

    generateProvider(SqlUserRepository, [], USER_REPOSITORY),
    generateProvider(
      SqlSessionRepository,
      [DATE_TIME_PROVIDER],
      SESSION_REPOSITORY,
    ),
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

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SystemRequestValidationMiddleware)
      .forRoutes(
        `${baseRoute}/${endpointsPaths.userWithId}`,
        `${baseRoute}/${endpointsPaths.userWithFullName}`,
      );
  }
}
