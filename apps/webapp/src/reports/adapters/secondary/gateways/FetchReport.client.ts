import {
  changeRuleValidationStateDto,
  interpolateUrlParams,
  ReportFileUsage,
  ReportsContextRestContract,
  ReportUpdateDto,
  reportUpdateDto,
} from "shared-models";
import {
  ReportApiClient,
  UploadFileArg,
} from "../../../core-logic/gateways/ReportApi.client";

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
      method,
    });
    return response.json();
  }

  async list() {
    const { method, path }: ClientFetchOptions["listReports"] = {
      method: "GET",
      path: "transparences",
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
      method,
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
      method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async uploadFiles(
    id: string,
    files: UploadFileArg[],
    usage: ReportFileUsage,
  ) {
    const formData = new FormData();
    files.forEach(({ file }) => {
      formData.append("files", file, file.name);
    });
    const fileIds = files.map(({ fileId }) => fileId);

    const {
      method,
      path,
      params,
      body,
      queryParams,
    }: ClientFetchOptions["uploadFiles"] = {
      method: "POST",
      path: ":id/files/upload-many",
      params: { id },
      body: formData,
      queryParams: { usage, fileIds },
    };
    const url = this.resolveUrl(path, params, queryParams);
    await this.fetch(url, {
      method,
      body,
    });
  }

  async deleteFile(reportId: string, fileName: string) {
    const { method, path, params }: ClientFetchOptions["deleteFile"] = {
      method: "DELETE",
      path: ":id/files/byName/:fileName",
      params: { id: reportId, fileName },
    };
    const url = this.resolveUrl(path, params);
    await this.fetch(url, {
      method,
    });
  }

  async deleteFiles(reportId: string, fileNames: string[]) {
    const {
      method,
      path,
      params,
      queryParams,
    }: ClientFetchOptions["deleteFiles"] = {
      method: "DELETE",
      path: ":id/files/byNames",
      params: { id: reportId },
      queryParams: { fileNames },
    };
    const url = this.resolveUrl(path, params, queryParams);
    await this.fetch(url, {
      method,
    });
  }

  private resolveUrl(
    path: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string | string[]>,
  ): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(fullPath, this.baseUrl);
    if (queryParams) this.buildQueryParams(url, queryParams);

    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private buildQueryParams(
    url: URL,
    searchParams: Record<string, string | string[]>,
  ) {
    Object.entries(searchParams).forEach(([key, values]) => {
      if (typeof values === "string") url.searchParams.append(key, values);
      else values.forEach((value) => url.searchParams.append(key, value));
    });
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
