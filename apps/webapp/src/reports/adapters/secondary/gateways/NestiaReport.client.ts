import * as apiSdk from "api-sdk";
import { ReportUpdateDto } from "api-sdk/generated/structures/ReportUpdateDto";
import { ReportListingVM, ReportRetrievalVM } from "shared-models";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";

const reportsSdk = apiSdk.functional.api.reports;

export class NestiaReportClient implements ReportApiClient {
  async updateReport(reportId: string, data: ReportUpdateDto): Promise<void> {
    await reportsSdk.updateReport(
      {
        host: import.meta.env.VITE_API_URL,
      },
      reportId,
      data,
    );
  }
  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await reportsSdk.rules.updateRule(
      {
        host: import.meta.env.VITE_API_URL,
      },
      ruleId,
      {
        validated,
      },
    );
  }

  async retrieveReport(id: string): Promise<ReportRetrievalVM | null> {
    const report = await reportsSdk.retrieveReport(
      {
        host: import.meta.env.VITE_API_URL,
      },
      id,
    );
    return report as ReportRetrievalVM | null;
  }
  async list(): Promise<ReportListingVM> {
    const reports = await reportsSdk.getReports({
      host: import.meta.env.VITE_API_URL,
    });
    return reports as ReportListingVM;
  }
}
