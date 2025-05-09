import { Gender, Role } from "shared-models";
import { ReportBuilder } from "../../../../reports/core-logic/builders/Report.builder";
import { listReport } from "../../../../reports/core-logic/use-cases/report-listing/listReport.use-case";
import { retrieveReport } from "../../../../reports/core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { expectUnauthenticatedStoreFactory } from "../../../../test/authentication";
import { expectStoredReportsFactory } from "../../../../test/reports";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { LocalStorageLogoutNotifierProvider } from "../../../adapters/secondary/providers/localStorageLogoutNotifier.provider";
import { StubLogoutNotifierProvider } from "../../../adapters/secondary/providers/stubLogoutNotifier.provider";
import { LogoutNotifierProvider } from "../../providers/logoutNotifier.provider";
import { logout } from "./logout";

describe("Logout", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let initialState: AppState<true>;
  let apiClient: FakeAuthenticationApiClient;
  let logoutNotifierProvider: LogoutNotifierProvider;
  let expectUnauthenticatedStore: () => void;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      "username",
      "password",
      "John",
      "Doe",
      Role.MEMBRE_COMMUN,
      Gender.M,
    );

    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    logoutNotifierProvider = new StubLogoutNotifierProvider();
  });

  describe("With fake storage provider", () => {
    beforeEach(() => {
      logoutNotifierProvider = new StubLogoutNotifierProvider();
      initStore();
    });

    it("disconnects a user", async () => {
      await store.dispatch(logout());
      expectUnauthenticatedStore();
    });

    it("clears the reports from the store on logout", async () => {
      givenSomeReport();
      await store.dispatch(logout());
      expectStoredReportsFactory(store, initialState)();
    });

    it("informs the browser about a disconnected user", async () => {
      await store.dispatch(logout());
      expect(
        (logoutNotifierProvider as StubLogoutNotifierProvider).hasNotified,
      ).toBe(true);
    });
  });

  describe("With local storage provider", () => {
    beforeEach(() => {
      localStorage.clear();
      logoutNotifierProvider = new LocalStorageLogoutNotifierProvider();
      initStore();
    });

    afterAll(() => localStorage.clear());

    it("informs the browser about a disconnected user", async () => {
      await store.dispatch(logout());
      expectLocalStorageNotification();
      await expectEndOfLocalStorageNotification();
    });

    const expectLocalStorageNotification = () => {
      expect(
        localStorage.getItem(LocalStorageLogoutNotifierProvider.logoutKey),
      ).toEqual("true");
    };

    const expectEndOfLocalStorageNotification = async () => {
      await sleep(LocalStorageLogoutNotifierProvider.notificationDelay + 10);
      expect(
        localStorage.getItem(LocalStorageLogoutNotifierProvider.logoutKey),
      ).toBeNull();
    };
  });

  const givenSomeReport = () => {
    store.dispatch(listReport.fulfilled([aReportListSM], "", undefined));
    store.dispatch(
      retrieveReport.fulfilled(aReportRetrieveSM, "", aReportRetrieveSM.id),
    );
  };

  const initStore = () => {
    store = initReduxStore(
      {
        authenticationGateway,
      },
      { logoutNotifierProvider },
      {},
    );
    initialState = store.getState();

    expectUnauthenticatedStore = expectUnauthenticatedStoreFactory(
      store,
      initialState,
    );
  };
});

const aReportListSM = new ReportBuilder().buildListSM();
const aReportRetrieveSM = new ReportBuilder().buildRetrieveSM();
