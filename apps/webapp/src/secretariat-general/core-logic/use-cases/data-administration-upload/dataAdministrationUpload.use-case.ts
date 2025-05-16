import { NouvelleTransparenceDto } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export const dataAdministrationUpload = createAppAsyncThunk<
  void,
  NouvelleTransparenceDto
>(
  "data-administration/nouvelleTransparence",
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

    fileProvider.assertMimeTypeFactory(acceptedMimeTypes);

    await dataAdministrationGateway.uploadTransparency(nouvelleTransparenceDto);
  },
);
