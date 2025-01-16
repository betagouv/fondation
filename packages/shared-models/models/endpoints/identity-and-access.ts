import { z } from "zod";
import { RestContract, ZodDto, ZodParamsDto } from "./common";

export interface IdentityAndAccessRestContract extends RestContract {
  basePath: "api/auth";
  endpoints: {
    login: {
      method: "POST";
      path: "login";
      body: LoginDto;
      response: AuthenticatedUser | null;
    };
    validateSession: {
      method: "POST";
      path: "validate-session";
      body: ValidateSessionDto;
      response: string | null;
    };
    logout: {
      method: "POST";
      path: "logout";
      response: void;
    };
    userWithFullName: {
      method: "GET";
      path: "user-with-full-name/:fullName";
      params: UserFromFullNameParamsDto;
      response: AuthenticatedUser | null;
    };
  };
}

export interface AuthenticatedUser {
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ValidateSessionDto {
  sessionId: string;
}

export interface UserFromFullNameParamsDto extends Record<string, string> {
  fullName: string;
}

export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}) satisfies ZodDto<IdentityAndAccessRestContract, "login">;

export const validateSessionDtoSchema = z.object({
  sessionId: z.string(),
}) satisfies ZodDto<IdentityAndAccessRestContract, "validateSession">;

export const userWithFullNameParamsDtoSchema = z.object({
  fullName: z.string().min(3),
}) satisfies ZodParamsDto<IdentityAndAccessRestContract, "userWithFullName">;
