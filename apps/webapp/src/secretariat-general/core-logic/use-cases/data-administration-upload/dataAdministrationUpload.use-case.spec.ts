import { ImportNouvelleTransparenceDto, Magistrat } from "shared-models";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import {
  dataAdministrationUpload,
  ImportTransparenceXlsxDto,
} from "./dataAdministrationUpload.use-case";

describe("Data Administration Upload", () => {
  let store: ReduxStore;
  let dataAdministrationClient: FakeApiDataAdministrationClient;
  let fileProvider: StubNodeFileProvider;

  beforeEach(async () => {
    dataAdministrationClient = new FakeApiDataAdministrationClient();
    const dataAdministrationGateway = new ApiDataAdministrationGateway(
      dataAdministrationClient,
    );
    fileProvider = new StubNodeFileProvider();

    store = initReduxStore(
      {
        dataAdministrationGateway,
      },
      {
        fileProvider,
      },
      {},
    );
  });

  it("upload une transparence", async () => {
    fileProvider.mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    await uploadTransparence(uneTransparenceImportée);
    expectClientTransparences(uneTransparenceImportée);
  });

  it("refuses les formats non autorisés", async () => {
    fileProvider.mimeType = "application/pdf";
    await uploadTransparence(unFichierPdf);
    expectClientTransparences();
  });

  const uploadTransparence = async (transparence: ImportTransparenceXlsxDto) =>
    store.dispatch(dataAdministrationUpload(transparence));

  const expectClientTransparences = (
    ...transparences: ImportNouvelleTransparenceDto[]
  ) => {
    expect(Object.values(dataAdministrationClient.transparences)).toEqual<
      ImportNouvelleTransparenceDto[]
    >(transparences);
  };
});

const uneTransparenceImportée = {
  nomTransparence: "Balai",
  formation: Magistrat.Formation.SIEGE,
  dateTransparence: "2023-01-01",
  dateEcheance: "2023-01-01",
  datePriseDePosteCible: "2024-01-01",
  dateClotureDelaiObservation: "2024-01-05",
  fichier: new File([""], "transparence.xlsx"),
} satisfies ImportTransparenceXlsxDto;

const unFichierPdf = {
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
