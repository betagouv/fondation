import {
  ReportListingVM,
  ReportRetrievalVM,
  ReportUpdateDto,
} from "shared-models";

export interface ReportApiClient {
  generateFileUrl(reportId: string, fileName: string): Promise<string>;
  list(): Promise<ReportListingVM>;
  updateReport(reportId: string, data: ReportUpdateDto): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
  attachFile(reportId: string, file: File): Promise<void>;
  deleteAttachedFile(reportId: string, fileName: string): Promise<void>;
}
