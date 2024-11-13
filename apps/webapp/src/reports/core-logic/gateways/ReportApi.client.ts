import { ReportUpdateDto } from "api-sdk/generated/structures/ReportUpdateDto";
import { ReportListingVM, ReportRetrievalVM } from "shared-models";

export interface ReportApiClient {
  list(): Promise<ReportListingVM>;
  updateReport(reportId: string, data: ReportUpdateDto): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
}
