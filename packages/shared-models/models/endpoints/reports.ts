import { z } from "zod";
import { NominationFile } from "../nomination-file.namespace";
import { ReportFileUsage, ReportRetrievalVM } from "../report-retrieval-vm";
import { ReportListingVM } from "../reports-listing-vm";
import {
  RestContract,
  ZodDto,
  ZodParamsDto,
  ZodQueryParamsDto,
} from "./common";

export interface ReportsContextRestContract extends RestContract {
  basePath: "api/reports";
  endpoints: {
    retrieveReport: {
      method: "GET";
      path: ":id";
      params: { id: string };
      response: ReportRetrievalVM;
    };
    updateReport: {
      method: "PUT";
      path: ":id";
      params: { id: string };
      body: ReportUpdateDto;
      response: void;
    };
    updateRule: {
      method: "PUT";
      path: "rules/:ruleId";
      params: { ruleId: string };
      body: ChangeRuleValidationStateDto;
      response: void;
    };
    listReports: {
      method: "GET";
      path: "";
      response: ReportListingVM;
    };
    uploadFiles: {
      method: "POST";
      path: ":id/files/upload-many";
      params: { id: string };
      queryParams: { usage: ReportFileUsage; fileIds: string | string[] };
      body: FormData;
      response: void;
    };
    generateFileUrl: {
      method: "GET";
      path: ":reportId/files/byName/:fileName";
      params: { reportId: string; fileName: string };
      response: string;
    };
    deleteFile: {
      method: "DELETE";
      path: ":id/files/byName/:fileName";
      params: { id: string; fileName: string };
      response: void;
    };
    deleteFiles: {
      method: "DELETE";
      path: ":id/files/byNames";
      params: { id: string };
      queryParams: { fileNames: string | string[] };
      response: void;
    };
  };
}

export interface ReportUpdateDto {
  state?: NominationFile.ReportState;
  comment?: string;
}

export interface ChangeRuleValidationStateDto {
  validated: boolean;
}

export const reportUpdateDto = z.object({
  state: z.nativeEnum(NominationFile.ReportState).optional(),
  comment: z.string().optional(),
}) satisfies ZodDto<ReportsContextRestContract, "updateReport">;

export const changeRuleValidationStateDto = z.object({
  validated: z.boolean(),
}) satisfies ZodDto<ReportsContextRestContract, "updateRule">;

export const uploadFilesParamsDtoSchema = z.object({
  id: z.string(),
}) satisfies ZodParamsDto<ReportsContextRestContract, "uploadFiles">;

export const uploadFilesQueryParamsDtoSchema = z.object({
  usage: z.nativeEnum(ReportFileUsage),
  fileIds: z
    .union([z.string(), z.string().array()])
    .transform((v) => (Array.isArray(v) ? v : [v])),
}) satisfies ZodQueryParamsDto<ReportsContextRestContract, "uploadFiles">;

export const deleteReportFilesQuerySchema = z.object({
  fileNames: z
    .union([z.string(), z.string().array()])
    .transform((v) => (Array.isArray(v) ? v : [v])),
}) satisfies ZodQueryParamsDto<ReportsContextRestContract, "deleteFiles">;
