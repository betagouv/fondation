import { ZodType } from "zod";

export type RestContract = {
  basePath: string;
  endpoints: Record<
    string,
    {
      body?: Record<string, any> | FormData;
      method: "GET" | "POST" | "PUT" | "DELETE";
      path: string;
      params?: Record<string, string>;
      queryParams?: Record<string, string | string[]>;
      response: Record<string, any> | string | null | void;
    }
  >;
};

export type ZodDto<
  C extends RestContract,
  E extends keyof C["endpoints"],
> = ZodType<C["endpoints"][E]["body"]>;

export type ZodParamsDto<
  C extends RestContract,
  E extends keyof C["endpoints"],
> = ZodType<C["endpoints"][E]["params"]>;

export type ZodQueryParamsDto<
  C extends RestContract,
  E extends keyof C["endpoints"],
> = ZodType<C["endpoints"][E]["queryParams"]>;

export const interpolateUrlParams = (
  url: URL,
  params: Record<string, string>
): string =>
  Object.keys(params).reduce(
    (resolvedPath, key) =>
      params[key] ? resolvedPath.replace(`:${key}`, params[key]) : resolvedPath,
    url.href
  );
