import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import { selectSecretariatGeneralAnchorAttributes } from "./selectSecretariatGeneralAnchorAttributes";

describe("selectSecretariatGeneralAnchorAttributes", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    routerProvider.onGoToLoginClick = vi.fn();

    store = initReduxStore({}, { routerProvider }, {});
  });
  it("should return the secretariat general anchor attributes", () => {
    const anchorAttributes = selectSecretariatGeneralAnchorAttributes(
      store.getState(),
    ).getDashboardAnchorAttributes();
    expect(anchorAttributes.href).toEqual(
      routerProvider.getSecretariatGeneralAnchorAttributes().href,
    );
  });

  it("should return the sg nouvelle transparence anchor attributes", () => {
    const anchorAttributes = selectSecretariatGeneralAnchorAttributes(
      store.getState(),
    ).getNouvelleTransparenceAnchorAttributes();
    expect(anchorAttributes.href).toEqual(
      routerProvider.getSgNouvelleTransparenceAnchorAttributes().href,
    );
  });
});
