import { FilesContextRestContract, Transparency } from "shared-models";
import {
  TransparencyApiClient,
  TransparencyAttachments,
} from "../../../core-logic/gateways/TransparencyApi.client";
import { UnionToTuple } from "type-fest";

type FilesEndpoints = FilesContextRestContract["endpoints"];
const filesBasePath: FilesContextRestContract["basePath"] = "api/files";

export class EnvTransparencyApiClient<
  T extends string[] = UnionToTuple<Transparency>,
  K extends T[number] = T[number],
> implements TransparencyApiClient<T, K>
{
  async getAttachments(transparency: K): Promise<TransparencyAttachments> {
    const transparenciesFileIdsSerialized = import.meta.env
      .VITE_GDS_TRANSPA_FILES_IDS!;

    const transparenciesFileIds = JSON.parse(
      transparenciesFileIdsSerialized,
    ) as Record<K, string[] | undefined>;

    const files =
      transparenciesFileIds[transparency]?.map((fileId) => ({
        fileId,
        metaPreSignedUrl: this.buildSignedUrlEndpoint(fileId),
      })) || [];

    return { files };
  }

  private buildSignedUrlEndpoint(fileId: string): string {
    const {
      path,
    }: Omit<FilesEndpoints["getSignedUrls"], "method" | "response"> = {
      path: "signed-urls",
      queryParams: { ids: fileId },
    };

    const apiBaseUrl = import.meta.env.VITE_API_URL!;
    const url = new URL(`${filesBasePath}/${path}`, apiBaseUrl);

    url.searchParams.append("ids", fileId);

    return url.toString();
  }
}
