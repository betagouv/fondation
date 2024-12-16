import { FakeAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../authentication/core-logic/gateways/authentication.gateway";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { listReport } from "./listReport.use-case";

describe("Nomination Files Listing", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let authenticationGateway: FakeAuthenticationGateway;
  let reportApiClient: FakeReportApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);

    authenticationGateway = new FakeAuthenticationGateway();

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
      reportApiClient.addReport(aReportApiModel);
    });

    describe("Authenticated user", () => {
      beforeEach(() => {
        authenticationGateway.setEligibleAuthUser(
          "user@example.fr",
          "password",
          user,
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
                reporterName: user.reporterName,
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

const user = {
  reporterName: "REPORTER Name",
} satisfies AuthenticatedUser;

const aReportApiModel = new ReportApiModelBuilder()
  .with("id", "user-report-id")
  .with("name", "Lucien Denan")
  .with("reporterName", user.reporterName)
  .with("dueDate", { year: 2030, month: 10, day: 10 })
  .build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildListSM();
