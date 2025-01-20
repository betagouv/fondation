import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { GenerateReportFileUrlUseCase } from 'src/reports-context/business-logic/use-cases/report-file-url-generation/generate-report-file-url';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportOnImportChangeUseCase } from 'src/reports-context/business-logic/use-cases/report-update-on-import-change/update-report-on-import-change.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DRIZZLE_DB,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { SqlReportAttachedFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-attached-file.repository';
import { SqlReportListingQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-listing-vm.query';
import { SqlReportRetrievalQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { SqlReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-report.repository';
import { HttpReportFileService } from '../../secondary/gateways/services/http-report-file-service';
import { NominationFileImportedSubscriber } from './event-subscribers/nomination-file-imported.subscriber';
import { NominationFileUpdatedSubscriber } from './event-subscribers/nomination-file-updated.subscriber';
import { generateReportsProvider as generateProvider } from './provider-generator';
import { ReportsController } from './reports.controller';
import {
  REPORT_ATTACHED_FILE_REPOSITORY,
  REPORT_FILE_SERVICE,
  REPORT_LISTING_QUERY,
  REPORT_REPOSITORY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_RULE_REPOSITORY,
  USER_SERVICE,
} from './tokens';
import { DeleteReportAttachedFileUseCase } from 'src/reports-context/business-logic/use-cases/report-file-deletion/delete-report-attached-file';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { SessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/session-validation.middleware';
import { HttpUserService } from '../../secondary/gateways/services/http-user.service';
import { ReporterTranslatorService } from '../../secondary/gateways/services/reporter-translator.service';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';

@Module({
  imports: [SharedKernelModule],
  controllers: [ReportsController],
  providers: [
    generateProvider(NominationFileImportedSubscriber, [CreateReportUseCase]),
    generateProvider(NominationFileUpdatedSubscriber, [
      UpdateReportOnImportChangeUseCase,
    ]),

    generateProvider(UpdateReportOnImportChangeUseCase, [
      REPORT_REPOSITORY,
      REPORT_RULE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(CreateReportUseCase, [
      REPORT_REPOSITORY,
      TRANSACTION_PERFORMER,
      UUID_GENERATOR,
      REPORT_RULE_REPOSITORY,
      DATE_TIME_PROVIDER,
      ReporterTranslatorService,
    ]),
    generateProvider(ChangeRuleValidationStateUseCase, [
      REPORT_RULE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(RetrieveReportUseCase, [
      REPORT_RETRIEVAL_QUERY,
      REPORT_FILE_SERVICE,
    ]),
    generateProvider(ListReportsUseCase, [REPORT_LISTING_QUERY]),
    generateProvider(UpdateReportUseCase, [
      REPORT_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(AttachReportFileUseCase, [
      REPORT_ATTACHED_FILE_REPOSITORY,
      REPORT_FILE_SERVICE,
      DATE_TIME_PROVIDER,
      TRANSACTION_PERFORMER,
      REPORT_REPOSITORY,
      UUID_GENERATOR,
      ReporterTranslatorService,
    ]),
    generateProvider(GenerateReportFileUrlUseCase, [
      TRANSACTION_PERFORMER,
      REPORT_ATTACHED_FILE_REPOSITORY,
      REPORT_FILE_SERVICE,
    ]),
    generateProvider(DeleteReportAttachedFileUseCase, [
      REPORT_ATTACHED_FILE_REPOSITORY,
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
    generateProvider(
      SqlReportAttachedFileRepository,
      [],
      REPORT_ATTACHED_FILE_REPOSITORY,
    ),
  ],
})
export class ReportsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionValidationMiddleware).forRoutes(ReportsController);
  }
}
