import { createAppAsyncThunkFactory } from "../../../../store/createAppAsyncThunk";
import { NouvelleTransparenceDto } from "../../../adapters/primary/components/NouvelleTransparence/NouvelleTransparence";

export const dataAdministrationUpload = createAppAsyncThunkFactory<string[]>()<
  void,
  NouvelleTransparenceDto
>(
  "secretariatGeneral/nouvelleTransparence",
  async (
    nouvelleTransparenceDto,
    {
      getState,
      extra: {
        gateways: { dataAdministrationGateway },
        providers: { fileProvider },
      },
    },
  ) => {
    const acceptedMimeTypes =
      getState().secretariatGeneral.nouvelleTransparence.acceptedMimeTypes
        .attachedFiles;

    await fileProvider.assertMimeTypeFactory(acceptedMimeTypes)(
      nouvelleTransparenceDto.fichier,
    );

    await dataAdministrationGateway.uploadTransparence(nouvelleTransparenceDto);
  },
);
