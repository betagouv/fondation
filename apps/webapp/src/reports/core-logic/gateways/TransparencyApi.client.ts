import { Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";

export type EndpointResponse<T> = Promise<T>;

export type TransparencyAttachments = {
  // TODO metaPreSignedUrl correspond à l'URL pour fetch les urls pré-signées,
  // dans une logique HATEOAS.
  // Un nom plus parlant peut sûrement être trouvé.
  files: { fileId: string; metaPreSignedUrl: string }[];
};

export interface TransparencyApiClient<
  T extends string[] = UnionToTuple<Transparency>,
  K extends T[number] = T[number],
> {
  getAttachments(transparency: K): EndpointResponse<TransparencyAttachments>;
}
