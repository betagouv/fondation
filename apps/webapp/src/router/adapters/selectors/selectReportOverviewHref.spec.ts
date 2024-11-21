import { initReduxStore, ReduxStore } from "../../../reports/store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import { selectReportListHref } from "./selectReportOverviewHref";

describe("Select Nomination File Overview Href", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
  });

  it("selects the nomination file overview href", () => {
    expect(selectReportListHref(store.getState())).toEqual(
      routerProvider.getReportListHref(),
    );
  });
});