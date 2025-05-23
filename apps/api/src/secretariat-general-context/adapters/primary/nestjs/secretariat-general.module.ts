import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { DomainRegistry } from 'src/reports-context/business-logic/models/domain-registry';
import { DataAdministrationController } from 'src/data-administration-context/adapters/primary/nestjs/data-administration.controller';
import { SessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/session-validation.middleware';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  DATE_TIME_PROVIDER,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';

import { generateSecretariatGeneralProvider as generateProvider } from 'src/secretariat-general-context/adapters/primary/nestjs/provider-generator';
import { NouvelleTransparenceUseCase } from 'src/secretariat-general-context/business-logic/use-cases/nouvelle-transparence/nouvelle-transparence.use-case';

@Module({
  imports: [SharedKernelModule],
  controllers: [DataAdministrationController],
  providers: [
    generateProvider(NouvelleTransparenceUseCase, [TRANSACTION_PERFORMER]),
  ],
})
export class SecretariatGeneralModule implements NestModule, OnModuleInit {
  constructor(
    @Inject(UUID_GENERATOR)
    private readonly uuidGenerator: UuidGenerator,
    @Inject(DATE_TIME_PROVIDER)
    private readonly dateTimeProvider: DateTimeProvider,
  ) {}

  onModuleInit() {
    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    DomainRegistry.setDateTimeProvider(this.dateTimeProvider);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionValidationMiddleware)
      .forRoutes(DataAdministrationController);
  }
}
