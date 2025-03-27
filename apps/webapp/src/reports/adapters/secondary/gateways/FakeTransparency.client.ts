import { SetRequired } from "type-fest";
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
    this.assertGdsFiles(this.files);
    return this.files.GDS[transparency] ?? { files: [] };
  }

  addGdsFiles(transparency: K, files: TransparencyAttachments) {
    this.files.GDS[transparency] = files;
  }

  setGdsFiles(transparency: K, files: TransparencyAttachments) {
    this.assertGdsFiles(this.files);
    this.files.GDS[transparency] = files;
  }

  private assertGdsFiles(
    files: FakeTransparencyApiClient["files"],
  ): asserts files is SetRequired<FakeTransparencyApiClient["files"], "GDS"> {
    if (!files.GDS) throw new Error();
  }
}
