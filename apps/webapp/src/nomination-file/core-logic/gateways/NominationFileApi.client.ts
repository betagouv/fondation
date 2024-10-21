import { ReportUpdateDto } from "@/api-sdk/generated/structures/ReportUpdateDto";
import { ReportListingVM, ReportRetrievalVM } from "@/shared-models";

export interface NominationFileApiClient {
  list(): Promise<ReportListingVM>;
  updateReport(reportId: string, data: ReportUpdateDto): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveNominationFile(id: string): Promise<ReportRetrievalVM | null>;
}
