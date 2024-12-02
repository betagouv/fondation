import { ReportListingVM, ReportRetrievalVM } from "shared-models";
import {
  changeRuleValidationStateDto,
  Endpoint,
  ReportsEndpoints,
  ReportUpdateDto,
  reportUpdateDto,
} from "shared-models";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";

export class FetchReportApiClient implements ReportApiClient {
  constructor(private readonly baseUrl: string) {}

  async retrieveReport(id: string): Promise<ReportRetrievalVM | null> {
    return this.fetchJson({
      endpoint: ReportsEndpoints.retrieveReport,
      params: { id },
    });
  }

  async list(): Promise<ReportListingVM> {
    return this.fetchJson({
      endpoint: ReportsEndpoints.listReports,
    });
  }

  async updateReport(id: string, data: ReportUpdateDto): Promise<void> {
    reportUpdateDto.parse(data);
    await this.fetchJson({
      endpoint: ReportsEndpoints.updateReport,
      params: { id },
      body: {
        state: data.state,
        comment: data.comment,
      },
    });
  }

  async updateRule(id: string, validated: boolean): Promise<void> {
    changeRuleValidationStateDto.parse({ validated });
    await this.fetchJson({
      endpoint: ReportsEndpoints.updateRule,
      params: { ruleId: id },
      body: { validated },
    });
  }

  async attachFile(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const url = this.resolveUrl(ReportsEndpoints.attachFile.path, { id });

    await fetch(`${this.baseUrl}/${url}`, {
      method: ReportsEndpoints.attachFile.method,
      body: formData,
    });
  }

  async generateFileUrl(reportId: string, fileName: string): Promise<string> {
    const url = this.resolveUrl(ReportsEndpoints.generateFileUrl.path, {
      reportId,
      fileName,
    });
    const response = await fetch(`${this.baseUrl}/${url}`, {
      method: ReportsEndpoints.generateFileUrl.method,
    });
    return await response.text();
  }

  async deleteAttachedFile(reportId: string, fileName: string): Promise<void> {
    return this.fetchJson({
      endpoint: ReportsEndpoints.deleteAttachedFile,
      params: {
        id: reportId,
        fileName,
      },
    });
  }

  private async fetchJson<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    E extends Endpoint<any, any, any>,
    Params extends E["Params"] = E["Params"],
    Body extends E["Body"] = E["Body"],
    Response extends E["Response"] = E["Response"],
  >({
    endpoint,
    params,
    body,
  }: {
    endpoint: E;
    params?: Params;
    body?: Body;
  }): Promise<Response> {
    const url = this.resolveUrl(endpoint.path, params);
    const response = await fetch(`${this.baseUrl}/${url}`, {
      method: endpoint.method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : undefined),
        ...(endpoint.headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get("Content-Length");
    const status = response.status;

    // If no content, return null or appropriate value
    if (
      status !== 204 && // No Content
      status !== 205 && // Reset Content
      contentLength !== "0" // Zero Content-Length
    )
      return response.json();

    return (await response.text()) as Response;
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    if (!params) return path;
    return Object.keys(params).reduce(
      (resolvedPath, key) =>
        params[key]
          ? resolvedPath.replace(`:${key}`, params[key])
          : resolvedPath,
      path,
    );
  }
}
