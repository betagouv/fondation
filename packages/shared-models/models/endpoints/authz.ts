import { z } from "zod";
import { type RestContract, type ZodParamsDto } from "./common";

export interface IdentityAndAccessAuthzRestContract extends RestContract {
  basePath: "api/authz";
  endpoints: {
    userCanReadFile: {
      method: "GET";
      path: "user/:userId/can-read-file/:fileId";
      params: UserCanReadFileParamsDto;
      response: boolean;
    };
  };
}

export interface UserCanReadFileParamsDto extends Record<string, string> {
  userId: string;
  fileId: string;
}

export const userCanReadFileParamsDtoSchema = z.object({
  userId: z.string().uuid(),
  fileId: z.string().uuid(),
}) satisfies ZodParamsDto<
  IdentityAndAccessAuthzRestContract,
  "userCanReadFile"
>;
