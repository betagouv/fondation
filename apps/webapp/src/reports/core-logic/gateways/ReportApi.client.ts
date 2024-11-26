import {
  ReportListingVM,
  ReportRetrievalVM,
  ReportUpdateDto,
} from "shared-models";

export interface ReportApiClient {
  attachFile(reportId: string, file: File): Promise<void>;
  generateFileUrl(reportId: string, fileName: string): Promise<string>;
  list(): Promise<ReportListingVM>;
  updateReport(reportId: string, data: ReportUpdateDto): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
}
