import { FileVM, Magistrat, Role, Transparency } from "shared-models";
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
      formation: Magistrat.Formation;
    }
  >(
    "transparencies/getAttachments",
    async (
      { transparency, formation },
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

      const filteredAttachments = filterAttachments(
        user.role,
        formation,
        attachments,
      );

      const fileVMs = await fileGateway.getSignedUrls(filteredAttachments);

      return fileVMs.sort((a, b) => a.name.localeCompare(b.name));
    },
  );

const filterAttachments = (
  role: Role,
  formation: Magistrat.Formation,
  files: TransparencyAttachments,
) => {
  switch (formation) {
    case Magistrat.Formation.PARQUET:
      if ([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET].includes(role))
        return [...files.siegeEtParquet, ...files.parquet];
      break;
    case Magistrat.Formation.SIEGE:
      if ([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE].includes(role))
        return [...files.siegeEtParquet, ...files.siege];
      break;
    default: {
      const _exhaustiveCheck: never = formation;
      console.info(_exhaustiveCheck);
      throw new Error(
        `Formation ${formation} not handled in filterAttachments function`,
      );
    }
  }

  return [];
};
