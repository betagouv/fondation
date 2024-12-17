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
      response: Record<string, any> | string | null | void;
    }
  >;
};

export type ZodDto<
  C extends RestContract,
  E extends keyof C["endpoints"],
> = ZodType<C["endpoints"][E]["body"]>;
