import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DataAdministrationUploadParams = {
  file: File;
};

export const dataAdministrationUpload = createAppAsyncThunk<
  void,
  DataAdministrationUploadParams
>(
  "data-administration/uploadTransparency",
  async (
    { file },
    {
      extra: {
        gateways: { dataAdministrationGateway },
      },
    },
  ) => {
    await dataAdministrationGateway.uploadTransparency(file);
  },
);

// TODO VERIFIER LE TYPE DE FICHIER
// TODO CREER LES TESTS UNITAIRES POUR LE GATEWAY ET L'IMPLEMENTATION DU CLIENT
