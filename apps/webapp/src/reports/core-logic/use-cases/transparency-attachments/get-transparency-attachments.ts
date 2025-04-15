import { FileVM, Role, Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";
import { createAppAsyncThunkFactory } from "../../../../store/createAppAsyncThunk";
import { TransparencyAttachments } from "../../gateways/TransparencyApi.client";

export const getTransparencyAttachmentsFactory = <
  T extends string[] = UnionToTuple<Transparency>,
>() =>
  createAppAsyncThunkFactory<T>()<
    FileVM[],
    {
      transparency: T[number];
    }
  >(
    "transparencies/getAttachments",
    async (
      { transparency },
      {
        getState,
        extra: {
          gateways: { transparencyGateway, fileGateway },
        },
      },
    ) => {
      const user = getState().authentication.user;
      if (!user) throw new Error("User not found");

      const attachments =
        await transparencyGateway.getAttachments(transparency);

      const filteredAttachments = filterAttachments(user.role, attachments);

      const fileVMs = await fileGateway.getSignedUrls(filteredAttachments);

      return fileVMs.sort((a, b) => a.name.localeCompare(b.name));
    },
  );

const filterAttachments = (role: Role, files: TransparencyAttachments) => {
  switch (role) {
    case Role.MEMBRE_COMMUN:
    case Role.MEMBRE_DU_PARQUET:
      return files.siegeEtParquet.concat(files.parquet);
    case Role.MEMBRE_DU_SIEGE:
      return files.siegeEtParquet;
    default: {
      const _exhaustiveCheck: never = role;
      console.info(_exhaustiveCheck);
      throw new Error(`Role ${role} not handled in filterAttachments function`);
    }
  }
};
