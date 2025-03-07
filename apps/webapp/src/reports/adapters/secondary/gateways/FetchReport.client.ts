import {
  changeRuleValidationStateDto,
  ReportsContextRestContract,
  ReportUpdateDto,
  reportUpdateDto,
  interpolateUrlParams,
  ReportFileUsage,
} from "shared-models";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";

type Endpoints = ReportsContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: ReportsContextRestContract["basePath"] = "api/reports";

export class FetchReportApiClient implements ReportApiClient {
  constructor(private readonly baseUrl: string) {}

  async retrieveReport(id: string) {
    const { method, path, params }: ClientFetchOptions["retrieveReport"] = {
      method: "GET",
      path: ":id",
      params: { id },
    };
    const url = this.resolveUrl(path, params);
    const response = await this.fetch(url, {
      method: method,
    });
    return response.json();
  }

  async list() {
    const { method, path }: ClientFetchOptions["listReports"] = {
      method: "GET",
      path: "",
    };
    const url = this.resolveUrl(path);
    const response = await this.fetch(url, {
      method,
    });
    return response.json();
  }

  async updateReport(id: string, data: ReportUpdateDto) {
    reportUpdateDto.parse(data);
    const { method, path, params, body }: ClientFetchOptions["updateReport"] = {
      method: "PUT",
      path: ":id",
      params: { id },
      body: data,
    };
    const url = this.resolveUrl(path, params);
    await this.fetch(url, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async updateRule(id: string, validated: boolean) {
    changeRuleValidationStateDto.parse({ validated });
    const { method, path, params, body }: ClientFetchOptions["updateRule"] = {
      method: "PUT",
      path: "rules/:ruleId",
      params: { ruleId: id },
      body: { validated },
    };
    const url = this.resolveUrl(path, params);
    await this.fetch(url, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async attachFile(id: string, file: File, usage: ReportFileUsage) {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const {
      method,
      path,
      params,
      body,
      queryParams,
    }: ClientFetchOptions["attachFile"] = {
      method: "POST",
      path: ":id/files/upload-one",
      params: { id },
      body: formData,
      queryParams: { usage },
    };
    const url = this.resolveUrl(path, params, queryParams);
    await this.fetch(url, {
      method: method,
      body: body,
    });
  }

  async generateFileUrl(reportId: string, fileName: string) {
    const { method, path, params }: ClientFetchOptions["generateFileUrl"] = {
      method: "GET",
      path: ":reportId/files/:fileName",
      params: { reportId, fileName },
    };
    const url = this.resolveUrl(path, params);
    const response = await this.fetch(url, {
      method: method,
    });
    return await response.text();
  }

  async deleteAttachedFile(reportId: string, fileName: string) {
    const { method, path, params }: ClientFetchOptions["deleteAttachedFile"] = {
      method: "DELETE",
      path: ":id/files/:fileName",
      params: { id: reportId, fileName },
    };
    const url = this.resolveUrl(path, params);

    await this.fetch(url, {
      method: method,
    });
  }

  private resolveUrl(
    path: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>,
  ): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(fullPath, this.baseUrl);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
      }
    }
    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, {
      ...requestInit,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
