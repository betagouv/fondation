import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalQuery } from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportAttachedFileRepository } from 'src/reports-context/business-logic/gateways/repositories/report-attached-file.repository';
import { ReportRuleRepository } from 'src/reports-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';
export const REPORT_RULE_REPOSITORY = 'REPORT_RULE_REPOSITORY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_FILE_SERVICE = 'REPORT_FILE_SERVICE';
export const REPORT_ATTACHED_FILE_REPOSITORY =
  'REPORT_ATTACHED_FILE_REPOSITORY';
export const USER_SERVICE = 'USER_SERVICE';

export const reportsTokens = [
  ...sharedKernelTokens,
  REPORT_REPOSITORY,
  REPORT_RULE_REPOSITORY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_LISTING_QUERY,
  REPORT_FILE_SERVICE,
  REPORT_ATTACHED_FILE_REPOSITORY,
  USER_SERVICE,
] as const;

export interface ReportsInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [REPORT_REPOSITORY]: ReportRepository;
  [REPORT_RULE_REPOSITORY]: ReportRuleRepository;
  [REPORT_RETRIEVAL_QUERY]: ReportRetrievalQuery;
  [REPORT_LISTING_QUERY]: ReportListingQuery;
  [REPORT_FILE_SERVICE]: ReportFileService;
  [REPORT_ATTACHED_FILE_REPOSITORY]: ReportAttachedFileRepository;
  [USER_SERVICE]: UserService;
}
