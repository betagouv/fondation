import { ApiAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { AuthenticatedUserSM } from "../../../../authentication/core-logic/gateways/Authentication.gateway";
import { AuthenticateParams } from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { listReport } from "./listReport.use-case";

describe("Reports Listing", () => {
  let store: ReduxStore;
  let initialState: AppState;
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
    );
    initialState = store.getState();
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
        );
      });

      it("lists the report", async () => {
        await store.dispatch(listReport());
        expect(store.getState()).toEqual<AppState>({
          ...initialState,
          reportList: {
            ...initialState.reportList,
            data: [
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
            ],
          },
        });
      });
    });
  });
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
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
