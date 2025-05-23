import { Magistrat } from "shared-models";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { NouvelleTransparenceDto } from "../../../adapters/primary/components/NouvelleTransparence/NouvelleTransparence";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import { dataAdministrationUpload } from "./dataAdministrationUpload.use-case";

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

  const uploadTransparence = async (transparence: NouvelleTransparenceDto) =>
    store.dispatch(dataAdministrationUpload(transparence));

  const expectClientTransparences = (
    ...transparences: NouvelleTransparenceDto[]
  ) => {
    expect(Object.values(dataAdministrationClient.transparences)).toEqual<
      NouvelleTransparenceDto[]
    >(transparences);
  };
});

const uneTransparenceImportée: NouvelleTransparenceDto = {
  transparenceName: "Balai",
  formation: Magistrat.Formation.SIEGE,
  transparenceDate: "2023-01-01",
  dateEcheance: "2023-01-01",
  datePriseDePoste: "2024-01-01",
  fichier: new File([""], "transparence.xlsx"),
};

const unFichierPdf: NouvelleTransparenceDto = {
  transparenceName: "Balai",
  formation: Magistrat.Formation.SIEGE,
  transparenceDate: "2023-01-01",
  dateEcheance: "2023-01-01",
  datePriseDePoste: "2024-01-01",
  fichier: new File([""], "transparence.pdf", {
    type: "application/pdf",
  }),
};
