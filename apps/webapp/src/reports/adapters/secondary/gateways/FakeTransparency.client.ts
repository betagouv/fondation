import {
  EndpointResponse,
  TransparencyApiClient,
  TransparencyAttachments,
} from "../../../core-logic/gateways/TransparencyApi.client";

export class FakeTransparencyApiClient<
  T extends string[] = string[],
  K extends T[number] = string,
> implements TransparencyApiClient<T, K>
{
  files: { GDS: Record<K, TransparencyAttachments | undefined> } = {
    GDS: {} as Record<K, TransparencyAttachments | undefined>,
  };

  async getAttachments(
    transparency: K,
  ): EndpointResponse<TransparencyAttachments> {
    return (
      this.files.GDS[transparency] ?? {
        siegeEtParquet: [],
        parquet: [],
      }
    );
  }

  setGdsFiles(transparency: K, files: TransparencyAttachments) {
    this.files.GDS[transparency] = files;
  }
}
