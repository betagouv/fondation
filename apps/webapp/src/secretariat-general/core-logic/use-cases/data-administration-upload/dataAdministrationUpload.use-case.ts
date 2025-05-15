import { NouvelleTransparenceDto } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DataAdministrationUploadParams = {
  nouvelleTransparenceForm: NouvelleTransparenceDto;
  file: File;
};

export const dataAdministrationUpload = createAppAsyncThunk<
  void,
  DataAdministrationUploadParams
>(
  "data-administration/uploadTransparency",
  async (
    { nouvelleTransparenceForm, file },
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

    await dataAdministrationGateway.uploadTransparency(
      nouvelleTransparenceForm,
      file,
    );
  },
);
