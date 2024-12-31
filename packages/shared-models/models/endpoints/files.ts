import { z } from "zod";
import { NominationFile } from "../nomination-file.namespace";
import { RestContract, ZodParamsDto } from "./common";
import type FormData from "form-data";

export type FileVM = { name: string; signedUrl: string };

export interface FilesContextRestContract extends RestContract {
  basePath: "api/files";
  endpoints: {
    uploadFile: {
      method: "POST";
      path: "upload-one";
      queryParams: {
        bucket: string;
        path?: string | string[];
        fileId: string;
      };
      body: FormData;
      response: void;
    };
    getSignedUrls: {
      method: "GET";
      path: "signed-urls";
      queryParams: { ids: string | string[] };
      response: FileVM[];
    };
    deleteFile: {
      method: "DELETE";
      path: ":id";
      params: { id: string };
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

export const fileUploadQueryDtoSchema = z.object({
  bucket: z.string(),
  path: z
    .union([z.string(), z.array(z.string())])
    .transform<string[]>((value) => (Array.isArray(value) ? value : [value]))
    .optional(),
  fileId: z.string(),
}) satisfies ZodParamsDto<FilesContextRestContract, "uploadFile">;

export const fileUrlsQuerySchema = z.object({
  ids: z
    .union([z.string(), z.string().array()])
    .transform((v) => (Array.isArray(v) ? v : [v])),
}) satisfies ZodParamsDto<FilesContextRestContract, "getSignedUrls">;