import { Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";
import { z } from "zod";

export type EndpointResponse<T> = Promise<T>;

export const transparencyAttachmentsSchema = z.object({
  siegeEtParquet: z.string().array(),
  parquet: z.string().array(),
  siege: z.string().array(),
});

export const transparenciesAttachmentsSchema = z.record(
  z.string(),
  transparencyAttachmentsSchema,
);

export type TransparencyAttachments = z.infer<
  typeof transparencyAttachmentsSchema
>;

export interface TransparencyApiClient<
  T extends string[] = UnionToTuple<Transparency>,
  K extends T[number] = T[number],
> {
  getAttachments(transparency: K): EndpointResponse<TransparencyAttachments>;
}
