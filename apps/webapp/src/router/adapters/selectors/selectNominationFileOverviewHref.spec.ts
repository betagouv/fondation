import {
  initReduxStore,
  ReduxStore,
} from "../../../nomination-file/store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import { selectNominationFileListHref } from "./selectNominationFileOverviewHref";

describe("Select Nomination File Overview Href", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
  });

  it("selects the nomination file overview href", () => {
    expect(selectNominationFileListHref(store.getState())).toEqual(
      routerProvider.getNominationFileListHref(),
    );
  });
});
