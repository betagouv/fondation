import {
  transparenciesAttachmentsSchema,
  TransparencyApiClient,
  TransparencyAttachments,
} from "../../../core-logic/gateways/TransparencyApi.client";

export class EnvTransparencyApiClient implements TransparencyApiClient {
  async getAttachments(transparency: string): Promise<TransparencyAttachments> {
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
