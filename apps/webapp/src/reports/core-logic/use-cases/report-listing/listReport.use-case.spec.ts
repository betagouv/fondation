import { Role } from "shared-models";
import { ApiAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { AuthenticatedUserSM } from "../../../../authentication/core-logic/gateways/Authentication.gateway";
import { AuthenticateParams } from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import {
  expectStoredReportsFactory,
  expectStoredReportsListFactory,
} from "../../../../test/reports";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { preloadReportsRetrieval } from "../../listeners/preload-reports-retrieval.listeners";
import { listReport } from "./listReport.use-case";

describe("Reports Listing", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let reportApiClient: FakeReportApiClient;
  let apiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);

    apiClient = new FakeAuthenticationApiClient();
    authenticationGateway = new ApiAuthenticationGateway(apiClient);

    store = initReduxStore(
      {
        reportGateway,
        authenticationGateway,
      },
      {},
      {},
      { preloadReportsRetrieval },
    );
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      reportApiClient.addReports(aReportApiModel);
    });

    describe("Authenticated user", () => {
      beforeEach(() => {
        apiClient.setEligibleAuthUser(
          userCredentials.email,
          userCredentials.password,
          user.firstName,
          user.lastName,
          user.role,
        );
      });

      it("lists the report", async () => {
        await store.dispatch(listReport());
        const stateWithPendingReportOverview = store.getState();
        expectStoredReportsListFactory(
          store,
          stateWithPendingReportOverview,
        )([
          {
            id: aReport.id,
            folderNumber: aReport.folderNumber,
            name: aReport.name,
            dueDate: aReport.dueDate,
            state: aReport.state,
            formation: aReport.formation,
            transparency: aReport.transparency,
            grade: aReport.grade,
            targettedPosition: aReport.targettedPosition,
            observersCount: aReport.observersCount,
          },
        ]);
      });

      it("preloads the reports overviews", async () => {
        await store.dispatch(listReport());
        const stateBeforePreload = store.getState();
        await sleep(50);

        expectStoredReportsFactory(
          store,
          stateBeforePreload,
        )(ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM());
      });
    });
  });
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
  role: Role.MEMBRE_COMMUN,
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};

const aReportApiModel = new ReportApiModelBuilder()
  .with("id", "user-report-id")
  .with("name", "Lucien Denan")
  .with("dueDate", { year: 2030, month: 10, day: 10 })
  .build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildListSM();
