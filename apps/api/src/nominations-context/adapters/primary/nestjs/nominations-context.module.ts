import {
  Inject,
  MiddlewareConsumer,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { generateNominationsProvider as generateProvider } from './provider-generator';
import {
  AFFECTATION_REPOSITORY,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  SESSION_REPOSITORY,
} from './tokens';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';
import { GetDossierDeNominationSnapshotUseCase } from 'src/nominations-context/sessions/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { GetSessionSnapshotUseCase } from 'src/nominations-context/sessions/business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';
import { GdsNouvellesTransparencesImportéesNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-nouvelles-transparences-importées.nest-subscriber';
import { GdsTransparenceDossiersModifiésNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-transparence-dossiers-modifiés.nest-subscriber';
import { GdsTransparenceNouveauxDossiersNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-transparence-nouveaux-dossiers.nest-subscriber';
import { GdsNouvellesTransparencesImportéesSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-nouvelles-transparences-importées.subscriber';
import { GdsTransparenceDossiersModifiésSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-dossiers-modifiés.subscriber';
import { GdsTransparenceNouveauxDossiersSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-nouveaux-dossiers.subscriber';
import { TransparenceService } from 'src/nominations-context/pp-gds/transparences/business-logic/services/transparence.service';
import { UpdateDossierDeNominationUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';
import { ImportNouvelleTransparenceUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { ImportNouveauxDossiersTransparenceUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';
import {
  baseRoute,
  endpointsPaths,
  SessionsController,
} from 'src/nominations-context/sessions/adapters/primary/nestjs/sessions.controller';
import { SqlAffectationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-affectation.repository';
import { SqlDossierDeNominationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-dossier-de-nomination.repository';
import { SqlPréAnalyseRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-pre-analyse.repository';
import { SqlSessionRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-session.repository';
import { SystemRequestValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/system-request.middleware';

@Module({
  imports: [SharedKernelModule],
  controllers: [SessionsController],
  providers: [
    GdsNouvellesTransparencesImportéesNestSubscriber,
    GdsTransparenceNouveauxDossiersNestSubscriber,
    GdsTransparenceDossiersModifiésNestSubscriber,

    generateProvider(GdsTransparenceNouveauxDossiersSubscriber, [
      ImportNouveauxDossiersTransparenceUseCase,
    ]),
    generateProvider(GdsTransparenceDossiersModifiésSubscriber, [
      UpdateDossierDeNominationUseCase,
    ]),
    generateProvider(GdsNouvellesTransparencesImportéesSubscriber, [
      ImportNouvelleTransparenceUseCase,
    ]),

    generateProvider(GetSessionSnapshotUseCase, [
      SESSION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(GetDossierDeNominationSnapshotUseCase, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(ImportNouvelleTransparenceUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceService,
    ]),
    generateProvider(UpdateDossierDeNominationUseCase, [
      TRANSACTION_PERFORMER,
      DOSSIER_DE_NOMINATION_REPOSITORY,
    ]),
    generateProvider(ImportNouveauxDossiersTransparenceUseCase, [
      TRANSACTION_PERFORMER,
      SESSION_REPOSITORY,
      TransparenceService,
    ]),

    generateProvider(TransparenceService, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      SESSION_REPOSITORY,
      AFFECTATION_REPOSITORY,
      DOMAIN_EVENT_REPOSITORY,
    ]),

    generateProvider(SqlSessionRepository, [], SESSION_REPOSITORY),
    generateProvider(
      SqlDossierDeNominationRepository,
      [],
      DOSSIER_DE_NOMINATION_REPOSITORY,
    ),
    generateProvider(SqlPréAnalyseRepository, [], PRE_ANALYSE_REPOSITORY),
    generateProvider(SqlAffectationRepository, [], AFFECTATION_REPOSITORY),
  ],
  exports: [],
})
export class NominationsContextModule implements OnModuleInit {
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
      .apply(SystemRequestValidationMiddleware)
      .forRoutes(
        `${baseRoute}/${endpointsPaths.sessionSnapshot}`,
        `${baseRoute}/${endpointsPaths.dossierDeNominationSnapshot}`,
      );
  }
}
