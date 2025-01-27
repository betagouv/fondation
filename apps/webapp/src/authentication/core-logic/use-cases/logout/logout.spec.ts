import { ReportBuilder } from "../../../../reports/core-logic/builders/Report.builder";
import { listReport } from "../../../../reports/core-logic/use-cases/report-listing/listReport.use-case";
import { retrieveReport } from "../../../../reports/core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { expectUnauthenticatedStoreFactory } from "../../../../test/authentication";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { StubLogoutNotifierProvider } from "../../../adapters/secondary/providers/stubLogoutNotifier.provider";
import { storeDisconnectionOnLogout } from "../../listeners/logout.listeners";
import { logout } from "./logout";

describe("Logout", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;
  let apiClient: FakeAuthenticationApiClient;
  let logoutNotifierProvider: StubLogoutNotifierProvider;
  let expectUnauthenticatedStore: () => void;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser("username", "password", "John", "Doe");

    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    authenticationStorageProvider = new FakeAuthenticationStorageProvider();
    logoutNotifierProvider = new StubLogoutNotifierProvider();

    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider, logoutNotifierProvider },
      {},
      { storeDisconnectionOnLogout },
    );
    initialState = store.getState();

    expectUnauthenticatedStore = expectUnauthenticatedStoreFactory(
      store,
      initialState,
    );
  });

  it("disconnects a user", async () => {
    await store.dispatch(logout());
    expectUnauthenticatedStore();
  });

  it("persists the disconnection", async () => {
    authenticationStorageProvider._isAuthenticated = true;
    store.dispatch(logout.fulfilled(undefined, "", undefined));
    expect(await authenticationStorageProvider.isAuthenticated()).toBe(false);
  });

  it("clears the reports from the store on logout", async () => {
    givenSomeReport();
    await store.dispatch(logout());
    expectUnauthenticatedStore();
  });

  it("informs the browser about a disconnected user", async () => {
    await store.dispatch(logout());
    expect(logoutNotifierProvider.hasNotified).toBe(true);
    expect(initialState).toBe(store.getState());
  });

  const givenSomeReport = () => {
    store.dispatch(listReport.fulfilled([aReportListSM], "", undefined));
    store.dispatch(
      retrieveReport.fulfilled(aReportRetrieveSM, "", aReportRetrieveSM.id),
    );
  };
});

const aReportListSM = new ReportBuilder().buildListSM();
const aReportRetrieveSM = new ReportBuilder().buildRetrieveSM();
