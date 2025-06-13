import { NominationsContextTransparenceRestContract } from "shared-models";

export type EndpointResponse<
  T extends keyof NominationsContextTransparenceRestContract["endpoints"],
> = Promise<
  NominationsContextTransparenceRestContract["endpoints"][T]["response"]
>;

export interface TransparenceClient {
  transparence(
    args: NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"],
  ): EndpointResponse<"transparenceSnapshot">;
}
