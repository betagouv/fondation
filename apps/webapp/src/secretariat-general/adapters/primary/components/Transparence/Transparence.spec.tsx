import { Provider } from "react-redux";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { AppState } from "../../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import { FakeTransparenceClient } from "../../../secondary/gateways/FakeTransparence.client";
import { render, screen } from "@testing-library/react";
import { ApiNominationsGateway } from "../../../secondary/gateways/ApiNominations.gateway";
import { Transparence } from "./Transparence";

describe("Transparence Component", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let transparenceClient: FakeTransparenceClient;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    transparenceClient = new FakeTransparenceClient();

    store = initReduxStore(
      {
        nominationsGateway: new ApiNominationsGateway(transparenceClient),
      },
      { routerProvider },
      {},
    );
    initialState = store.getState();
  });

  it("indique que la transpa n'a pas été trouvée", async () => {
    renderTransparenceByCompositeId("invalid-id");
    await screen.findByText("Session de type Transparence non trouvée.");
  });

  const renderTransparenceByCompositeId = (transpareneId: string) => {
    return render(
      <Provider store={store}>
        <Transparence id={transpareneId} />
      </Provider>,
    );
  };
});
