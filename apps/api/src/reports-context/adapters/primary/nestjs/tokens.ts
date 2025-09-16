import {
  IdentityAndAccessRestContract,
  NominationsContextSessionsRestContract,
} from 'shared-models';
import { DossierDeNominationRestContrat } from 'shared-models/models/endpoints/nominations/dossier-de-nominations.endpoints';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalQuery } from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportRuleRepository } from 'src/reports-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import { DossierDeNominationService } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { SessionService } from 'src/reports-context/business-logic/gateways/services/session.service';
import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';
export const REPORT_RULE_REPOSITORY = 'REPORT_RULE_REPOSITORY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_FILE_SERVICE = 'REPORT_FILE_SERVICE';
export const USER_SERVICE = 'USER_SERVICE';
export const SESSION_SERVICE = 'SESSION_SERVICE';
export const DOSSIER_DE_NOMINATION_SERVICE = 'DOSSIER_DE_NOMINATION_SERVICE';
export const NOMINATIONS_CONTEXT_HTTP_CLIENT =
  'NOMINATIONS_CONTEXT_HTTP_CLIENT';
export const IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT =
  'IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT';
export const DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT =
  'DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT';

export const reportsTokens = [
  ...sharedKernelTokens,
  REPORT_REPOSITORY,
  REPORT_RULE_REPOSITORY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_LISTING_QUERY,
  REPORT_FILE_SERVICE,
  USER_SERVICE,
  SESSION_SERVICE,
  DOSSIER_DE_NOMINATION_SERVICE,
  NOMINATIONS_CONTEXT_HTTP_CLIENT,
  DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT,
  IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT,
] as const;

export interface ReportsInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [REPORT_REPOSITORY]: ReportRepository;
  [REPORT_RULE_REPOSITORY]: ReportRuleRepository;
  [REPORT_RETRIEVAL_QUERY]: ReportRetrievalQuery;
  [REPORT_LISTING_QUERY]: ReportListingQuery;
  [REPORT_FILE_SERVICE]: ReportFileService;
  [USER_SERVICE]: UserService;
  [SESSION_SERVICE]: SessionService;
  [DOSSIER_DE_NOMINATION_SERVICE]: DossierDeNominationService;
  [NOMINATIONS_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<NominationsContextSessionsRestContract>;
  [DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<DossierDeNominationRestContrat>;
  [IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<IdentityAndAccessRestContract>;
}
