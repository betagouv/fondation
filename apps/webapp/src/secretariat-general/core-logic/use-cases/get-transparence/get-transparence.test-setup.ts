import { AppState, TransparenceSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiNominationsGateway } from "../../../adapters/secondary/gateways/ApiNominations.gateway";
import { FakeTransparenceClient } from "../../../adapters/secondary/gateways/FakeTransparence.client";
import {
  getTransparence,
  GetTransparenceParams,
} from "./get-transparence.use-case";

export class TestDependencies {
  readonly fakeTransparenceClient: FakeTransparenceClient;
  readonly store: ReduxStore;
  readonly initialState: AppState<true>;

  constructor() {
    this.fakeTransparenceClient = new FakeTransparenceClient();

    this.store = initReduxStore(
      {
        nominationsGateway: new ApiNominationsGateway(
          this.fakeTransparenceClient,
        ),
      },
      {},
      {},
    );
    this.initialState = this.store.getState();
  }

  getTransparence(params: GetTransparenceParams) {
    return this.store.dispatch(getTransparence(params));
  }

  expectStoreTransparences(...transparences: TransparenceSM[]) {
    expect(this.store.getState()).toEqual<AppState<true>>({
      ...this.initialState,
      secretariatGeneral: {
        ...this.initialState.secretariatGeneral,
        sessions: {
          ...this.initialState.secretariatGeneral.sessions,
          transparences: {
            ...this.initialState.secretariatGeneral.sessions.transparences,
            ...transparences.reduce(
              (acc, transpa) => ({
                ...acc,
                [`${transpa.nom}-${transpa.formation}-${Object.values(transpa.dateTransparence).join("-")}`]:
                  transpa,
              }),
              {},
            ),
          },
        },
      },
    });
  }
}
