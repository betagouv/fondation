import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import { selectLoginAnchorAttributes } from "./selectLoginAnchorAttributes";

describe("Select Login Anchor Attributes", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    routerProvider.onGoToLoginClick = vi.fn();

    store = initReduxStore({}, { routerProvider }, {});
  });

  it("selects the anchor attributes", () => {
    expect(selectLoginAnchorAttributes(store.getState()).href).toEqual(
      routerProvider.loginHref,
    );
  });

  it("clicks to redirect to the login page", () => {
    const { onClick } = selectLoginAnchorAttributes(store.getState());

    onClick({
      preventDefault: () => {},
    } as React.MouseEvent<HTMLAnchorElement>);

    expect(routerProvider.onGoToLoginClick).toHaveBeenCalledOnce();
  });
});
