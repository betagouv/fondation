import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import { selectReportListHref } from "./selectReportOverviewHref";

describe("Select Nomination File Overview Href", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
  });

  it("selects the report overview href", () => {
    expect(selectReportListHref(store.getState())).toEqual(
      routerProvider.getReportListHref(),
    );
  });
});
