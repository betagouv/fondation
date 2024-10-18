import { ReportListingVM, ReportRetrievalVM } from "@/shared-models";

export interface NominationFileApiClient {
  list(): Promise<ReportListingVM>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveNominationFile(id: string): Promise<ReportRetrievalVM | null>;
}
