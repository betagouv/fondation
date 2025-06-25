import { Magistrat } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { getTransparenceCompositeId } from "../../models/transparence.model";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";

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
  void | {
    validationError: string;
  },
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

    const { validationError } =
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

    if (!validationError) {
      const transparenceId = getTransparenceCompositeId(
        nouvelleTransparenceDto.nomTransparence,
        nouvelleTransparenceDto.formation,
        DateOnly.fromDateOnlyString(
          nouvelleTransparenceDto.dateTransparence,
          "yyyy-MM-dd",
        ).toStoreModel(),
      );

      // Temps pour que la transparence soit créée dans le backend
      await sleep(1000);
      routerProvider.gotToSgTransparence(transparenceId);
      return;
    } else {
      return { validationError };
    }
  },
);
