import { z } from "zod";
import { Gender } from "../gender";
import { Role } from "../role";
import { RestContract, ZodDto, ZodParamsDto } from "./common";

export interface IdentityAndAccessRestContract extends RestContract {
  basePath: "api/auth";
  endpoints: {
    login: {
      method: "POST";
      path: "login";
      body: LoginDto;
      response: AuthenticatedUser;
    };
    validateSessionFromCookie: {
      method: "POST";
      path: "validate-session-from-cookie";
      response: AuthenticatedUser | null;
    };
    validateSession: {
      method: "POST";
      path: "validate-session";
      body: ValidateSessionDto;
      response: AuthenticatedUser | null;
    };
    logout: {
      method: "POST";
      path: "logout";
      response: void;
    };
    userWithFullName: {
      method: "GET";
      path: "user-with-full-name/:fullName";
      params: UserWithFullNameParamsDto;
      response: AuthenticatedUser;
    };
    userWithId: {
      method: "GET";
      path: "user-with-id/:userId";
      params: UserWithIdParamsDto;
      response: AuthenticatedUser;
    };
  };
}

export interface AuthenticatedUser {
  userId: string;
  firstName: string;
  lastName: string;
  role: Role;
  gender: Gender;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ValidateSessionDto {
  sessionId: string;
}

export interface UserWithFullNameParamsDto extends Record<string, string> {
  fullName: string;
}

export interface UserWithIdParamsDto extends Record<string, string> {
  userId: string;
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

export const userWithIdParamsDtoSchema = z.object({
  userId: z.string().uuid(),
}) satisfies ZodParamsDto<IdentityAndAccessRestContract, "userWithId">;
