import { Magistrat } from "shared-models";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import {
  dataAdministrationUpload,
  NouvelleTransparenceArgs,
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

    store = initReduxStore<true, string[]>(
      {
        dataAdministrationGateway,
      },
      {
        fileProvider: fileProvider,
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

  const uploadTransparence = async (transparence: NouvelleTransparenceArgs) =>
    store.dispatch(dataAdministrationUpload(transparence));

  const expectClientTransparences = (
    ...transparences: NouvelleTransparenceArgs[]
  ) => {
    expect(Object.values(dataAdministrationClient.transparences)).toEqual<
      NouvelleTransparenceArgs[]
    >(transparences);
  };
});

const uneTransparenceImportée: NouvelleTransparenceArgs = {
  transparenceName: "Balai",
  formation: Magistrat.Formation.SIEGE,
  transparenceDate: new Date(2023, 1, 1),
  dateEcheance: new Date(2023, 1, 1),
  dateDePriseDePoste: new Date(2024, 1, 1),
  fichier: new File([""], "transparence.xlsx"),
};

const unFichierPdf: NouvelleTransparenceArgs = {
  transparenceName: "Balai",
  formation: Magistrat.Formation.SIEGE,
  transparenceDate: new Date(2023, 1, 1),
  dateEcheance: new Date(2023, 1, 1),
  dateDePriseDePoste: new Date(2024, 1, 1),
  fichier: new File([""], "transparence.pdf", {
    type: "application/pdf",
  }),
};
