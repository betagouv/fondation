import { ReportRetrievalVM } from "../report-retrieval-vm";
import { ReportListingVM } from "../reports-listing-vm";
import { NominationFile } from "../nomination-file.namespace";
import { z, ZodType } from "zod";

export interface ReportUpdateDto {
  state?: NominationFile.ReportState;
  comment?: string;
}

type ApiHeaders = {
  "Content-Type": "application/json";
};

export interface Endpoint<
  Params = void,
  Body = void,
  Response = void,
  EHeaders = ApiHeaders,
> {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  Params: Params;
  Body: Body;
  Response: Response;
  headers: EHeaders;
}

export const reportsControllerRoute = "api/reports";

export const reportsEndpointRelativePaths = {
  retrieveReport: ":id",
  listReports: "",
  updateReport: ":id",
  updateRule: "rules/:ruleId",
  attachFile: ":id/files/upload-one",
  generateFileUrl: ":reportId/files/:fileName",
  deleteAttachedFile: ":id/files/:fileName",
};

export const ReportsEndpoints = {
  retrieveReport: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.retrieveReport}`,
    method: "GET",
  } as Endpoint<{ id: string }, void, ReportRetrievalVM | null>,

  listReports: {
    path: `${reportsControllerRoute}`,
    method: "GET",
  } as Endpoint<void, void, ReportListingVM>,

  updateReport: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.updateReport}`,
    method: "PUT",
  } as Endpoint<{ id: string }, ReportUpdateDto, void>,

  updateRule: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.updateRule}`,
    method: "PUT",
  } as Endpoint<{ ruleId: string }, { validated: boolean }, void>,

  attachFile: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.attachFile}`,
    method: "POST",
  } as Endpoint<{ id: string }, FormData, void>,

  generateFileUrl: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.generateFileUrl}`,
    method: "GET",
  } as Endpoint<{ reportId: string; fileName: string }, void, string>,
  deleteAttachedFile: {
    path: `${reportsControllerRoute}/${reportsEndpointRelativePaths.deleteAttachedFile}`,
    method: "DELETE",
  } as Endpoint<{ id: string; fileName: string }, void, void>,
};

export const reportUpdateDto = z.object({
  state: z.nativeEnum(NominationFile.ReportState).optional(),
  comment: z.string().optional(),
}) satisfies z.ZodObject<{
  [K in keyof (typeof ReportsEndpoints.updateReport)["Body"]]: ZodType<
    (typeof ReportsEndpoints.updateReport)["Body"][K]
  >;
}>;

export const changeRuleValidationStateDto = z.object({
  validated: z.boolean(),
}) satisfies z.ZodObject<{
  [K in keyof (typeof ReportsEndpoints.updateRule)["Body"]]: ZodType<
    (typeof ReportsEndpoints.updateRule)["Body"][K]
  >;
}>;
