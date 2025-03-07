import type FormData from "form-data";
import { z } from "zod";
import { RestContract, ZodParamsDto, ZodQueryParamsDto } from "./common";

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

export const fileUploadQueryDtoSchema = z.object({
  bucket: z.string(),
  path: z
    .union([z.string(), z.array(z.string())])
    .transform<string[]>((value) => (Array.isArray(value) ? value : [value]))
    .optional(),
  fileId: z.string(),
}) satisfies ZodQueryParamsDto<FilesContextRestContract, "uploadFile">;

export const fileUrlsQuerySchema = z.object({
  ids: z
    .union([z.string(), z.string().array()])
    .transform((v) => (Array.isArray(v) ? v : [v])),
}) satisfies ZodQueryParamsDto<FilesContextRestContract, "getSignedUrls">;
