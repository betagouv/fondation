import {
  initReduxStore,
  ReduxStore,
} from "../../../nomination-case/store/reduxStore";
import { TypeRouterProvider } from "../type-route/typeRouter";
import { selectLoginHref } from "./selectLoginHref";

describe("Select Login Href", () => {
  let store: ReduxStore;
  let routerProvider: TypeRouterProvider;

  beforeEach(() => {
    routerProvider = new TypeRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
  });

  it("selects the login href", () => {
    expect(selectLoginHref(store.getState())).toEqual(
      routerProvider.getLoginHref()
    );
  });
});
