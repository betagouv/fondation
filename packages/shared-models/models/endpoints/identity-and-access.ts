import { z } from "zod";
import { RestContract, ZodDto } from "./common";

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

export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}) satisfies ZodDto<IdentityAndAccessRestContract, "login">;

export const validateSessionDtoSchema = z.object({
  sessionId: z.string(),
}) satisfies ZodDto<IdentityAndAccessRestContract, "validateSession">;
