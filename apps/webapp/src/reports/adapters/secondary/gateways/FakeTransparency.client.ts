import {
  EndpointResponse,
  TransparencyApiClient,
  TransparencyAttachments,
} from "../../../core-logic/gateways/TransparencyApi.client";

export class FakeTransparencyApiClient implements TransparencyApiClient {
  files: { GDS: Record<string, TransparencyAttachments | undefined> } = {
    GDS: {} as Record<string, TransparencyAttachments | undefined>,
  };

  async getAttachments(
    transparency: string,
  ): EndpointResponse<TransparencyAttachments> {
    return (
      this.files.GDS[transparency] ?? {
        siegeEtParquet: [],
        parquet: [],
        siege: [],
      }
    );
  }

  setGdsFiles(transparency: string, files: TransparencyAttachments) {
    this.files.GDS[transparency] = files;
  }
}
