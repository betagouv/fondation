import {
  Inject,
  MiddlewareConsumer,
  Module,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { GetDossierDeNominationSnapshotUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { PublierAffectationsUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/publier-affectations/publier-affectations.use-case';
import { SaveAffectationsRapporteursUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/save-affectations-rapporteurs/save-affectations-rapporteurs.use-case';
import { GdsNouvellesTransparencesImportéesNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-nouvelles-transparences-importées.nest-subscriber';
import { GdsTransparenceDossiersModifiésNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-transparence-dossiers-modifiés.nest-subscriber';
import { GdsTransparenceNouveauxDossiersNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/gds-transparence-nouveaux-dossiers.nest-subscriber';
import { TransparenceXlsxImportéeNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/transparence-xlsx-importée.nest-subscriber';
import { TransparenceXlsxObservantsImportésNestSubscriber } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/event-subscribers/transparence-xlsx-observants-importés.nest-subscriber';
import { TransparencesController } from 'src/nominations-context/pp-gds/transparences/adapters/primary/nestjs/transparence.controller';
import { SqlTransparenceRepository } from 'src/nominations-context/pp-gds/transparences/adapters/secondary/gateways/repositories/drizzle/sql-transparence.repository';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { GdsNouvellesTransparencesImportéesSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-nouvelles-transparences-importées.subscriber';
import { GdsTransparenceDossiersModifiésSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-dossiers-modifiés.subscriber';
import { GdsTransparenceNouveauxDossiersSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-nouveaux-dossiers.subscriber';
import { TransparenceXlsxImportéeSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/transparence-xlsx-importée.subscriber';
import { TransparenceXlsxObservantsImportésSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/transparence-xlsx-observants-importés.subscriber';
import { TransparenceService } from 'src/nominations-context/pp-gds/transparences/business-logic/services/transparence.service';
import { GetTransparenceSnapshotUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/get-transparence-snapshot/get-transparence-snapshot.use-case';
import { ImportNouveauxDossiersTransparenceUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';
import { ImportNouvelleTransparenceXlsxUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence-xlsx/import-nouvelle-transparence-xlsx.use-case';
import { ImportNouvelleTransparenceUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { UpdateDossierDeNominationUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';
import { UpdateObservantsUseCase } from 'src/nominations-context/pp-gds/transparences/business-logic/use-cases/update-observants/update-observants.use-case';
import {
  baseRoute as baseRouteSession,
  endpointsPaths as endpointsPathsSession,
  SessionsController,
} from 'src/nominations-context/sessions/adapters/primary/nestjs/sessions.controller';
import { SqlAffectationRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-affectation.repository';

import {
  baseRouteDossierDeNomination,
  DossierDeNominationController,
  dossierDeNominationsEndpointsPath,
} from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dossier-de-nomination.controller';
import { SqlDossierDeNominationRepository } from 'src/nominations-context/dossier-de-nominations/adapters/primary/secondary/gateways/repositories/drizzle/sql-dossier-de-nomination.repository';
import { GetBySessionIdUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-by-session-id/get-dossier-de-nomination-snapshot.use-case';
import { SqlPréAnalyseRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-pre-analyse.repository';
import { SqlSessionRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-session.repository';
import { DomainRegistry } from 'src/nominations-context/sessions/business-logic/models/domain-registry';
import { SessionEnrichmentService } from 'src/nominations-context/sessions/business-logic/services/session-enrichment.service';
import { SessionEnrichmentStrategyFactory } from 'src/nominations-context/sessions/business-logic/strategy/session-enrichment-strategy-factory';
import { TransparenceEnrichSessionStrategyImpl } from 'src/nominations-context/sessions/business-logic/strategy/transparence-enrich-session.strategy';
import { GetSessionSnapshotUseCase } from 'src/nominations-context/sessions/business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';
import { GetSessionsUseCase } from 'src/nominations-context/sessions/business-logic/use-cases/get-sessions/get-sessions.use-case';
import { SqlReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report.repository';
import { HandleAffectationUpdatedUseCase } from 'src/reports-context/business-logic/use-cases/handle-affectation-modifiée/handle-affectation-updated.use-case';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { SessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/session-validation.middleware';
import { SystemRequestValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/system-request.middleware';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
  USER_SERVICE,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { generateNominationsProvider as generateProvider } from './provider-generator';
import {
  AFFECTATION_REPOSITORY,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  REPORT_REPOSITORY,
  SESSION_ENRICHMENT_SERVICE,
  SESSION_ENRICHMENT_STRATEGY_FACTORY,
  SESSION_REPOSITORY,
  TRANSPARENCE_REPOSITORY,
} from './tokens';

@Module({
  imports: [SharedKernelModule],
  controllers: [
    SessionsController,
    TransparencesController,
    DossierDeNominationController,
  ],
  providers: [
    GdsNouvellesTransparencesImportéesNestSubscriber,
    GdsTransparenceNouveauxDossiersNestSubscriber,
    GdsTransparenceDossiersModifiésNestSubscriber,
    TransparenceXlsxImportéeNestSubscriber,
    TransparenceXlsxObservantsImportésNestSubscriber,

    generateProvider(GdsTransparenceNouveauxDossiersSubscriber, [
      ImportNouveauxDossiersTransparenceUseCase,
    ]),
    generateProvider(GdsTransparenceDossiersModifiésSubscriber, [
      UpdateDossierDeNominationUseCase,
    ]),
    generateProvider(GdsNouvellesTransparencesImportéesSubscriber, [
      ImportNouvelleTransparenceUseCase,
    ]),
    generateProvider(TransparenceXlsxImportéeSubscriber, [
      ImportNouvelleTransparenceXlsxUseCase,
    ]),
    generateProvider(TransparenceXlsxObservantsImportésSubscriber, [
      UpdateObservantsUseCase,
    ]),

    generateProvider(GetTransparenceSnapshotUseCase, [
      TRANSPARENCE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(GetSessionSnapshotUseCase, [
      SESSION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(GetSessionsUseCase, [
      SESSION_REPOSITORY,
      TRANSACTION_PERFORMER,
      SESSION_ENRICHMENT_SERVICE,
    ]),
    {
      provide: SESSION_ENRICHMENT_STRATEGY_FACTORY,
      useFactory: (transparenceRepository: TransparenceRepository) => {
        const strategies = [
          new TransparenceEnrichSessionStrategyImpl(transparenceRepository),
        ];
        return new SessionEnrichmentStrategyFactory(strategies);
      },
      inject: [TRANSPARENCE_REPOSITORY],
    },
    generateProvider(
      SessionEnrichmentService,
      [SESSION_ENRICHMENT_STRATEGY_FACTORY],
      SESSION_ENRICHMENT_SERVICE,
    ),
    generateProvider(GetDossierDeNominationSnapshotUseCase, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(GetBySessionIdUseCase, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      TRANSACTION_PERFORMER,
      AFFECTATION_REPOSITORY,
      USER_SERVICE,
    ]),
    {
      provide: CreateReportUseCase,
      useFactory: (reportRepository, domainEventRepository) => {
        return new CreateReportUseCase(reportRepository, domainEventRepository);
      },
      inject: [REPORT_REPOSITORY, DOMAIN_EVENT_REPOSITORY],
    },
    {
      provide: HandleAffectationUpdatedUseCase,
      useFactory: (reportRepository, createReportUseCase) => {
        return new HandleAffectationUpdatedUseCase(
          reportRepository,
          createReportUseCase,
        );
      },
      inject: [REPORT_REPOSITORY, CreateReportUseCase],
    },
    generateProvider(SaveAffectationsRapporteursUseCase, [
      AFFECTATION_REPOSITORY,
      SESSION_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(PublierAffectationsUseCase, [
      AFFECTATION_REPOSITORY,
      SESSION_REPOSITORY,
      HandleAffectationUpdatedUseCase,
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
    generateProvider(ImportNouvelleTransparenceXlsxUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceService,
    ]),
    generateProvider(UpdateObservantsUseCase, [
      TRANSACTION_PERFORMER,
      DOSSIER_DE_NOMINATION_REPOSITORY,
    ]),

    generateProvider(TransparenceService, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      SESSION_REPOSITORY,
      AFFECTATION_REPOSITORY,
      DOMAIN_EVENT_REPOSITORY,
    ]),

    generateProvider(SqlSessionRepository, [], SESSION_REPOSITORY),
    generateProvider(SqlTransparenceRepository, [], TRANSPARENCE_REPOSITORY),
    generateProvider(
      SqlDossierDeNominationRepository,
      [],
      DOSSIER_DE_NOMINATION_REPOSITORY,
    ),
    generateProvider(SqlPréAnalyseRepository, [], PRE_ANALYSE_REPOSITORY),
    generateProvider(SqlAffectationRepository, [], AFFECTATION_REPOSITORY),
    generateProvider(SqlReportRepository, [], REPORT_REPOSITORY),
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
      .apply(SessionValidationMiddleware)
      .forRoutes(
        TransparencesController,
        {
          path: `${baseRouteDossierDeNomination}/${dossierDeNominationsEndpointsPath.saveAffectationsRapporteurs}`,
          method: RequestMethod.POST,
        },
        {
          path: `${baseRouteDossierDeNomination}/affectations-rapporteurs/:sessionId/publier`,
          method: RequestMethod.POST,
        },
      )
      .apply(SystemRequestValidationMiddleware)
      .forRoutes(
        `${baseRouteSession}/${endpointsPathsSession.sessionSnapshot}`,
        `${baseRouteDossierDeNomination}/${dossierDeNominationsEndpointsPath.dossierDeNominationSnapshot}`,
      );
  }
}
