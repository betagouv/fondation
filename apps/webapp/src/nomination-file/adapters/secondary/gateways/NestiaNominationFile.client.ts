import * as apiSdk from "@/api-sdk";
import { ReportListingVM, ReportRetrievalVM } from "@/shared-models";
import { NominationFileApiClient } from "../../../core-logic/gateways/NominationFileApi.client";

export class NestiaNominationFileClient implements NominationFileApiClient {
  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await apiSdk.functional.api.reports.updateReportRule(
      {
        host: import.meta.env.VITE_API_URL,
      },
      ruleId,
      {
        validated,
      },
    );
  }

  async retrieveNominationFile(id: string): Promise<ReportRetrievalVM | null> {
    const report = await apiSdk.functional.api.reports.retrieveReport(
      {
        host: import.meta.env.VITE_API_URL,
      },
      id,
    );
    return report as ReportRetrievalVM | null;
  }

  async list(): Promise<ReportListingVM> {
    const reports = await apiSdk.functional.api.reports.getReports({
      host: import.meta.env.VITE_API_URL,
    });
    return reports as ReportListingVM;
  }
}
