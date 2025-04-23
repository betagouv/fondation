import { Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";
import {
  transparenciesAttachmentsSchema,
  TransparencyApiClient,
  TransparencyAttachments,
} from "../../../core-logic/gateways/TransparencyApi.client";

export class EnvTransparencyApiClient<
  T extends string[] = UnionToTuple<Transparency>,
  K extends T[number] = T[number],
> implements TransparencyApiClient<T, K>
{
  async getAttachments(transparency: K): Promise<TransparencyAttachments> {
    const transparenciesFileIdsSerialized = import.meta.env
      .VITE_GDS_TRANSPA_FILES_IDS!;

    const transparenciesFileIds = transparenciesAttachmentsSchema.parse(
      JSON.parse(transparenciesFileIdsSerialized),
    );

    return (
      transparenciesFileIds[transparency] ?? {
        siegeEtParquet: [],
        parquet: [],
        siege: [],
      }
    );
  }
}
