import { ImportNouvelleTransparenceDto, Magistrat } from "shared-models";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { routeChanged } from "../../../../router/core-logic/reducers/router.slice";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { AppState, QueryStatus } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiDataAdministrationGateway } from "../../../adapters/secondary/gateways/ApiDataAdministration.gateway";
import { FakeApiDataAdministrationClient } from "../../../adapters/secondary/gateways/FakeApiDataAdministration.client";
import {
  importObservantsXlsx,
  ImportObservantsXlsxDto,
} from "./importObservantsXlsx.use-case";

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
      fichier: new File([""], "transparence.xlsx"),
    } satisfies ImportObservantsXlsxDto;
  }

  unFichierPdfAImporter() {
    this.fileProvider.mimeType = "application/pdf";
    return {
      nomTransparence: "Balai",
      formation: Magistrat.Formation.SIEGE,
      dateTransparence: "2023-01-01",
      fichier: new File([""], "transparence.pdf", {
        type: "application/pdf",
      }),
    } satisfies ImportObservantsXlsxDto;
  }

  givenAFailedUpload() {
    this.store.dispatch(
      importObservantsXlsx.rejected(
        new Error(),
        "",
        this.uneTransparenceAImporter(),
      ),
    );
  }

  async importObservants(transparence: ImportObservantsXlsxDto) {
    await this.store.dispatch(importObservantsXlsx(transparence));
  }

  routeChangedToNouvelleTransparence() {
    this.store.dispatch(
      routeChanged(
        this.routerProvider.getSgNouvelleTransparenceAnchorAttributes().href,
      ),
    );
  }

  expectSuccessfulUpload() {
    this.expectUploadQueryStatus("fulfilled");
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
    expect(this.routerProvider.goToSgDashboard).toHaveBeenCalled();
  }

  expectValidationError(validationError: string) {
    expect(this.store.getState()).toEqual<AppState<true>>({
      ...this.initialState,
      secretariatGeneral: {
        ...this.initialState.secretariatGeneral,
        importObservants: {
          ...this.initialState.secretariatGeneral.importObservants,
          uploadQueryStatus: "rejected",
          validationError,
        },
      },
    });
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
        importObservants: {
          ...this.initialState.secretariatGeneral.importObservants,
          uploadQueryStatus: status,
        },
      },
    });
  }
}
