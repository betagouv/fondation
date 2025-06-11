import { Magistrat } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type ImportTransparenceXlsxDto = {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: string;
  dateEcheance: string | null;
  datePriseDePosteCible: string | null;
  dateClotureDelaiObservation: string;
  fichier: File;
};

export const dataAdministrationUpload = createAppAsyncThunk<
  void,
  ImportTransparenceXlsxDto
>(
  "secretariatGeneral/nouvelleTransparence",
  async (
    nouvelleTransparenceDto,
    {
      getState,
      extra: {
        gateways: { dataAdministrationGateway },
        providers: { fileProvider, routerProvider },
      },
    },
  ) => {
    const acceptedMimeTypes =
      getState().secretariatGeneral.nouvelleTransparence.acceptedMimeTypes
        .sourceDeDonnées;

    await fileProvider.assertMimeTypeFactory(acceptedMimeTypes)(
      nouvelleTransparenceDto.fichier,
    );

    await dataAdministrationGateway.importTransparenceXlsx(
      {
        nomTransparence: nouvelleTransparenceDto.nomTransparence,
        formation: nouvelleTransparenceDto.formation,
        dateTransparence: nouvelleTransparenceDto.dateTransparence,
        dateEcheance: nouvelleTransparenceDto.dateEcheance ?? undefined,
        datePriseDePosteCible:
          nouvelleTransparenceDto.datePriseDePosteCible ?? undefined,
        dateClotureDelaiObservation:
          nouvelleTransparenceDto.dateClotureDelaiObservation,
      },
      nouvelleTransparenceDto.fichier,
    );

    routerProvider.onGoToSecretariatGeneralClick();
  },
);
