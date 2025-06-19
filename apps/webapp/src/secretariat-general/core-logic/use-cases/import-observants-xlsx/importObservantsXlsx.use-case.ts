import { Magistrat } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type ImportObservantsXlsxDto = {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: string;
  fichier: File;
};

export const importObservantsXlsx = createAppAsyncThunk<
  void | {
    validationError: string;
  },
  ImportObservantsXlsxDto
>(
  "secretariatGeneral/importObservantsXlsx",
  async (
    importObservantsDto,
    {
      getState,
      extra: {
        gateways: { dataAdministrationGateway },
        providers: { fileProvider },
      },
    },
  ) => {
    const acceptedMimeTypes =
      getState().secretariatGeneral.importObservants.acceptedMimeTypes
        .sourceDeDonnées;

    await fileProvider.assertMimeTypeFactory(acceptedMimeTypes)(
      importObservantsDto.fichier,
    );

    const { validationError } =
      await dataAdministrationGateway.importObservantsXlsx(
        {
          nomTransparence: importObservantsDto.nomTransparence,
          formation: importObservantsDto.formation,
          dateTransparence: importObservantsDto.dateTransparence,
        },
        importObservantsDto.fichier,
      );

    return validationError ? { validationError } : undefined;
  },
);
