import {
  changeRuleValidationStateDto,
  ReportFileUsage,
  ReportsContextRestContract,
  ReportUpdateDto,
  reportUpdateDto,
} from "shared-models";
import { FetchClient } from "../../../../shared-kernel/adapters/secondary/providers/fetchClient";
import {
  ReportApiClient,
  UploadFileArg,
} from "../../../core-logic/gateways/ReportApi.client";

export class FetchReportApiClient implements ReportApiClient {
  constructor(
    private readonly requestClient: FetchClient<ReportsContextRestContract>,
  ) {}

  async retrieveReport(id: string) {
    const report = await this.requestClient.fetch<"retrieveReport">({
      method: "GET",
      path: ":id",
      params: { id },
    });
    return report;
  }

  async list() {
    const reports = await this.requestClient.fetch<"listReports">({
      method: "GET",
      path: "transparences",
    });
    return reports;
  }

  async updateReport(id: string, data: ReportUpdateDto) {
    reportUpdateDto.parse(data);

    await this.requestClient.fetch<"updateReport">({
      method: "PUT",
      path: ":id",
      params: { id },
      body: data,
    });
  }

  async updateRule(id: string, validated: boolean) {
    changeRuleValidationStateDto.parse({ validated });

    await this.requestClient.fetch<"updateRule">({
      method: "PUT",
      path: "rules/:ruleId",
      params: { ruleId: id },
      body: { validated },
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

    await this.requestClient.fetch<"uploadFiles">({
      method: "POST",
      path: ":id/files/upload-many",
      params: { id },
      body: formData,
      queryParams: { usage, fileIds },
    });
  }

  async deleteFile(reportId: string, fileName: string) {
    await this.requestClient.fetch<"deleteFile">({
      method: "DELETE",
      path: ":id/files/byName/:fileName",
      params: { id: reportId, fileName },
    });
  }

  async deleteFiles(reportId: string, fileNames: string[]) {
    await this.requestClient.fetch<"deleteFiles">({
      method: "DELETE",
      path: ":id/files/byNames",
      params: { id: reportId },
      queryParams: { fileNames },
    });
  }
}
