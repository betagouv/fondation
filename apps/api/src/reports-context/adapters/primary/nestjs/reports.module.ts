import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { ReportRuleRepository } from 'src/reports-context/business-logic/gateways/repositories/report-rule.repository';
import { DomainRegistry } from 'src/reports-context/business-logic/models/domain-registry';
import { AffectationRapporteursCrééeSubscriber } from 'src/reports-context/business-logic/subscribers/affectation-rapporteurs-créée.subscriber';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { DeleteReportAttachedFileUseCase } from 'src/reports-context/business-logic/use-cases/report-file-deletion/delete-report-attached-file';
import { DeleteReportAttachedFilesUseCase } from 'src/reports-context/business-logic/use-cases/report-files-deletion/delete-report-attached-files';
import { UploadReportFilesUseCase } from 'src/reports-context/business-logic/use-cases/report-files-upload/upload-report-files';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { SessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/session-validation.middleware';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DRIZZLE_DB,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { SqlReportListingQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-listing-vm.query';
import { SqlReportRetrievalQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { SqlReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-report.repository';
import { HttpReportFileService } from '../../secondary/gateways/services/http-report-file-service';
import { HttpUserService } from '../../secondary/gateways/services/http-user.service';
import { ReporterTranslatorService } from '../../secondary/gateways/services/reporter-translator.service';
import { AffectationRapporteursCrééeNestSubscriber } from './event-subscribers/affectation-rapporteurs-créée.nest-subscriber';
import { generateReportsProvider as generateProvider } from './provider-generator';
import { ReportsController } from './reports.controller';
import {
  REPORT_FILE_SERVICE,
  REPORT_LISTING_QUERY,
  REPORT_REPOSITORY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_RULE_REPOSITORY,
  USER_SERVICE,
} from './tokens';

@Module({
  imports: [SharedKernelModule],
  controllers: [ReportsController],
  providers: [
    generateProvider(AffectationRapporteursCrééeNestSubscriber, [
      AffectationRapporteursCrééeSubscriber,
    ]),
    generateProvider(AffectationRapporteursCrééeSubscriber, [
      CreateReportUseCase,
      TRANSACTION_PERFORMER,
    ]),

    generateProvider(CreateReportUseCase, [REPORT_REPOSITORY]),
    generateProvider(ChangeRuleValidationStateUseCase, [
      REPORT_RULE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(RetrieveReportUseCase, [REPORT_RETRIEVAL_QUERY]),
    generateProvider(ListReportsUseCase, [REPORT_LISTING_QUERY]),
    generateProvider(UpdateReportUseCase, [
      REPORT_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(UploadReportFilesUseCase, [
      REPORT_FILE_SERVICE,
      TRANSACTION_PERFORMER,
      REPORT_REPOSITORY,
      ReporterTranslatorService,
    ]),
    generateProvider(DeleteReportAttachedFileUseCase, [
      REPORT_REPOSITORY,
      REPORT_FILE_SERVICE,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(DeleteReportAttachedFilesUseCase, [
      REPORT_REPOSITORY,
      REPORT_FILE_SERVICE,
      TRANSACTION_PERFORMER,
    ]),

    {
      provide: REPORT_FILE_SERVICE,
      // generateProvider function doesn't handle the union type in ApiConfig
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new HttpReportFileService(
          apiConfig,
          systemRequestSignatureProvider,
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },
    generateProvider(ReporterTranslatorService, [USER_SERVICE]),
    {
      provide: USER_SERVICE,
      // generateProvider function doesn't handle the union type in ApiConfig
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new HttpUserService(apiConfig, systemRequestSignatureProvider);
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },

    generateProvider(SqlReportListingQuery, [DRIZZLE_DB], REPORT_LISTING_QUERY),
    generateProvider(
      SqlReportRetrievalQuery,
      [DRIZZLE_DB],
      REPORT_RETRIEVAL_QUERY,
    ),
    generateProvider(SqlReportRepository, [], REPORT_REPOSITORY),
    generateProvider(SqlReportRuleRepository, [], REPORT_RULE_REPOSITORY),
  ],
})
export class ReportsModule implements NestModule, OnModuleInit {
  constructor(
    @Inject(UUID_GENERATOR)
    private readonly uuidGenerator: UuidGenerator,
    @Inject(DATE_TIME_PROVIDER)
    private readonly dateTimeProvider: DateTimeProvider,
    @Inject(REPORT_RULE_REPOSITORY)
    private readonly reportRuleRepository: ReportRuleRepository,
  ) {}

  onModuleInit() {
    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    DomainRegistry.setDateTimeProvider(this.dateTimeProvider);
    DomainRegistry.setReportRuleRepository(this.reportRuleRepository);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionValidationMiddleware).forRoutes(ReportsController);
  }
}
