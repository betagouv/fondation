import { FakeAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../authentication/core-logic/gateways/authentication.gateway";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { listReport } from "./listReport.use-case";

describe("Nomination Files Listing", () => {
  let store: ReduxStore;
  let reportGateway: FakeReportGateway;
  let initialState: AppState;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
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
      reportGateway.addReport(aReport);
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

const aReport = new ReportBuilder()
  .with("id", "user-report-id")
  .with("name", "Lucien Denan")
  .with("reporterName", user.reporterName)
  .with("dueDate", new DateOnly(2030, 10, 30))
  .buildListVM();
