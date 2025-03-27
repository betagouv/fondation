import { Transparency } from "shared-models";
import { createAppAsyncThunkFactory } from "../../../../store/createAppAsyncThunk";
import { UnionToTuple } from "type-fest";

export const getTransparencyAttachmentsFactory = <
  T extends string[] = UnionToTuple<Transparency>,
>() =>
  createAppAsyncThunkFactory<T>()(
    "transparencies/getAttachments",
    async (
      { transparency }: { transparency: T[number] },
      {
        extra: {
          gateways: { transparencyGateway, fileGateway },
        },
      },
    ) => {
      const attachments =
        await transparencyGateway.getAttachments(transparency);
      return await fileGateway.getSignedUrls(
        attachments.files.map((file) => file.fileId),
      );
    },
  );
