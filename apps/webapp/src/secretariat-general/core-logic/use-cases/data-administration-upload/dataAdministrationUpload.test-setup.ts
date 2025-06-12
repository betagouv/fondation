import { ImportNouvelleTransparenceDto, Magistrat } from "shared-models";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import {
  dataAdministrationUpload,
  ImportTransparenceXlsxDto,
} from "./dataAdministrationUpload.use-case";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { AppState, QueryStatus } from "../../../../store/appState";
import { routeChanged } from "../../../../router/core-logic/reducers/router.slice";

export class TestDependencies {
  readonly dataAdministrationClient: FakeApiDataAdministrationClient;
  readonly dataAdministrationGateway: ApiDataAdministrationGateway;
  readonly fileProvider: StubNodeFileProvider;
  readonly routerProvider: StubRouterProvider;
  readonly store: ReduxStore;
  readonly initialState: AppState<true>;

  constructor() {
    this.dataAdministrationClient = new FakeApiDataAdministrationClient();
    this.dataAdministrationGateway = new ApiDataAdministrationGateway(
      this.dataAdministrationClient,
    );
    this.fileProvider = new StubNodeFileProvider();
    this.routerProvider = new StubRouterProvider();

    this.store = initReduxStore(
      {
        dataAdministrationGateway: this.dataAdministrationGateway,
      },
      {
        fileProvider: this.fileProvider,
        routerProvider: this.routerProvider,
      },
      {},
    );
    this.initialState = this.store.getState();
  }

  uneTransparenceImportée() {
    return {
      nomTransparence: "Balai",
      formation: Magistrat.Formation.SIEGE,
      dateTransparence: "2023-01-01",
      dateEcheance: "2023-01-01",
      datePriseDePosteCible: "2024-01-01",
      dateClotureDelaiObservation: "2024-01-05",
    } satisfies ImportNouvelleTransparenceDto;
  }

  uneTransparenceAImporter() {
    this.fileProvider.mimeType =
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
  }

  unFichierPdfAImporter() {
    this.fileProvider.mimeType = "application/pdf";
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
  }

  givenAFailedUpload() {
    this.store.dispatch(
      dataAdministrationUpload.rejected(
        new Error(),
        "",
        this.uneTransparenceAImporter(),
      ),
    );
  }

  async uploadTransparence(transparence: ImportTransparenceXlsxDto) {
    await this.store.dispatch(dataAdministrationUpload(transparence));
  }

  routeChangedToNouvelleTransparence() {
    this.store.dispatch(
      routeChanged(
        this.routerProvider.getSgNouvelleTransparenceAnchorAttributes().href,
      ),
    );
  }

  expectClientTransparences(...transparences: ImportNouvelleTransparenceDto[]) {
    expect(Object.values(this.dataAdministrationClient.transparences)).toEqual(
      transparences,
    );
  }

  expectFailedUpload() {
    this.expectUploadQueryStatus("rejected");
  }

  expectResetUploadQueryStatus() {
    this.expectUploadQueryStatus(
      "idle",
      this.routerProvider.getSgNouvelleTransparenceAnchorAttributes().href,
    );
  }

  expectPageSecretariatGeneral() {
    expect(
      this.routerProvider.onGoToSecretariatGeneralClick,
    ).toHaveBeenCalled();
  }

  private expectUploadQueryStatus(status: QueryStatus, currentHref?: string) {
    expect(this.store.getState()).toEqual<AppState<true>>({
      ...this.initialState,
      router: {
        ...this.initialState.router,
        hrefs: {
          ...this.initialState.router.hrefs,
          current: currentHref ?? this.initialState.router.hrefs.current,
        },
      },
      secretariatGeneral: {
        ...this.initialState.secretariatGeneral,
        nouvelleTransparence: {
          ...this.initialState.secretariatGeneral.nouvelleTransparence,
          uploadQueryStatus: status,
        },
      },
    });
  }
}
