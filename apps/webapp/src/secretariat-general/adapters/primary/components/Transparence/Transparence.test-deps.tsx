import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { Magistrat } from "shared-models";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { TransparenceSM } from "../../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import { getTransparence } from "../../../../core-logic/use-cases/get-transparence/get-transparence.use-case";
import { ApiNominationsGateway } from "../../../secondary/gateways/ApiNominations.gateway";
import { FakeTransparenceClient } from "../../../secondary/gateways/FakeTransparence.client";
import { Transparence } from "./Transparence";

export class TestDeps {
  private readonly store: ReduxStore;
  private readonly transparenceClient: FakeTransparenceClient;
  private readonly routerProvider: StubRouterProvider;

  constructor() {
    this.routerProvider = new StubRouterProvider();
    this.transparenceClient = new FakeTransparenceClient();
    this.store = initReduxStore(
      {
        nominationsGateway: new ApiNominationsGateway(this.transparenceClient),
      },
      { routerProvider: this.routerProvider },
      {},
    );
  }

  get uneTransparenceParquet() {
    const transpa = {
      id: "transparence-1",
      nom: "Transparence Test",
      formation: Magistrat.Formation.PARQUET,
      dateTransparence: {
        year: 2023,
        month: 10,
        day: 1,
      },
      dateClotureDelaiObservation: {
        year: 2023,
        month: 10,
        day: 15,
      },
    } satisfies TransparenceSM;

    return transpa;
  }

  renderTransparenceByCompositeId = (transpareneId: string) => {
    return render(
      <Provider store={this.store}>
        <Transparence id={transpareneId} />
      </Provider>,
    );
  };

  givenUneTransparenceParquet() {
    this.store.dispatch(
      getTransparence.fulfilled(this.uneTransparenceParquet, "", {
        nom: this.uneTransparenceParquet.nom,
        formation: this.uneTransparenceParquet.formation,
        year: this.uneTransparenceParquet.dateTransparence.year,
        month: this.uneTransparenceParquet.dateTransparence.month,
        day: this.uneTransparenceParquet.dateTransparence.day,
      }),
    );
  }
}
