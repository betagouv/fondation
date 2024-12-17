import { z, ZodType } from "zod";
import { NominationFile } from "../nomination-file.namespace";
import { ReportRetrievalVM } from "../report-retrieval-vm";
import { ReportListingVM } from "../reports-listing-vm";
import { RestContract, ZodDto } from "./common";

export interface ReportsContextRestContract extends RestContract {
  basePath: "api/reports";
  endpoints: {
    retrieveReport: {
      method: "GET";
      path: ":id";
      params: { id: string };
      response: ReportRetrievalVM | null;
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
    attachFile: {
      method: "POST";
      path: ":id/files/upload-one";
      params: { id: string };
      body: FormData;
      response: void;
    };
    generateFileUrl: {
      method: "GET";
      path: ":reportId/files/:fileName";
      params: { reportId: string; fileName: string };
      response: string;
    };
    deleteAttachedFile: {
      method: "DELETE";
      path: ":id/files/:fileName";
      params: { id: string; fileName: string };
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
