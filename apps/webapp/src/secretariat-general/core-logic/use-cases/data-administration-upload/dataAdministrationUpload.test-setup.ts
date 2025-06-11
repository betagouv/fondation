import { ImportNouvelleTransparenceDto, Magistrat } from "shared-models";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import {
  dataAdministrationUpload,
  ImportTransparenceXlsxDto,
} from "./dataAdministrationUpload.use-case";

export type TestDependencies = ReturnType<typeof getTestDependencies>;

export const getTestDependencies = () => {
  const dataAdministrationClient = new FakeApiDataAdministrationClient();
  const dataAdministrationGateway = new ApiDataAdministrationGateway(
    dataAdministrationClient,
  );
  const fileProvider = new StubNodeFileProvider();

  const store: ReduxStore = initReduxStore(
    {
      dataAdministrationGateway,
    },
    {
      fileProvider,
    },
    {},
  );

  const uneTransparenceImportée = () => {
    return {
      nomTransparence: "Balai",
      formation: Magistrat.Formation.SIEGE,
      dateTransparence: "2023-01-01",
      dateEcheance: "2023-01-01",
      datePriseDePosteCible: "2024-01-01",
      dateClotureDelaiObservation: "2024-01-05",
    } satisfies ImportNouvelleTransparenceDto;
  };

  const uneTransparenceAImporter = () => {
    fileProvider.mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return {
      nomTransparence: "Balai",
      formation: Magistrat.Formation.SIEGE,
      dateTransparence: "2023-01-01",
      dateEcheance: "2023-01-01",
      datePriseDePosteCible: "2024-01-01",
      dateClotureDelaiObservation: "2024-01-05",
      fichier: new File([""], "transparence.xlsx"),
    } satisfies ImportTransparenceXlsxDto;
  };

  const unFichierPdfAImporter = () => {
    fileProvider.mimeType = "application/pdf";
    return {
      nomTransparence: "Balai",
      formation: Magistrat.Formation.SIEGE,
      dateTransparence: "2023-01-01",
      dateEcheance: "2023-01-01",
      datePriseDePosteCible: "2024-01-01",
      dateClotureDelaiObservation: "2024-01-05",
      fichier: new File([""], "transparence.pdf", {
        type: "application/pdf",
      }),
    } satisfies ImportTransparenceXlsxDto;
  };

  const uploadTransparence = async (transparence: ImportTransparenceXlsxDto) =>
    store.dispatch(dataAdministrationUpload(transparence));

  const expectClientTransparences = (
    ...transparences: ImportNouvelleTransparenceDto[]
  ) => {
    expect(Object.values(dataAdministrationClient.transparences)).toEqual(
      transparences,
    );
  };

  return {
    dataAdministrationClient,
    dataAdministrationGateway,
    fileProvider,
    store,
    uploadTransparence,
    expectClientTransparences,

    uneTransparenceAImporter,
    uneTransparenceImportée,
    unFichierPdfAImporter,
  };
};
