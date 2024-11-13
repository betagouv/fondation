import { FakeAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../authentication/core-logic/gateways/authentication.gateway";
import { authenticate } from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import {
  ReportListItemVM,
  ReportListVM,
  selectReportList,
} from "./selectReportList";

describe("Select Nomination Case List", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  const onClick = () => null;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser(user.email, user.password, {
      reporterName: user.reporterName,
    });

    const stubRouterProvider = new StubRouterProvider();
    stubRouterProvider.onClickAttribute = onClick;
    store = initReduxStore(
      {},
      {
        routerProvider: stubRouterProvider,
      },
      {},
    );
  });

  it("shows an empty list", () => {
    expect(selectReportList(store.getState())).toEqual<ReportListVM>({
      reports: [],
    });
  });

  describe("when there are three nomination cases", () => {
    beforeEach(() => {
      store.dispatch(
        authenticate.fulfilled(user, "", {
          email: user.email,
          password: user.password,
        }),
      );
      store.dispatch(
        listReport.fulfilled(
          [aReport, aSecondReport, aThirdReport, anotherUserReport],
          "",
          undefined,
        ),
      );
    });

    it("selects the sorted list by folder number for the auth user", () => {
      expect(selectReportList(store.getState())).toEqual<ReportListVM>({
        reports: [aReportVM, aThirdReportVM, aSecondReportVM],
      });
    });
  });

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("folderNumber", 1)
    .with("name", "Banneau Louise")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const aReportVM: ReportListItemVM = {
    id: aReport.id,
    folderNumber: 1,
    name: aReport.name,
    reporterName: aReport.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/dossier-de-nomination/${aReport.id}`,
    onClick,
  };

  const aSecondReport = new ReportBuilder()
    .with("id", "report-id")
    .with("folderNumber", null)
    .with("name", "Denan Lucien")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const aSecondReportVM: ReportListItemVM = {
    id: aSecondReport.id,
    folderNumber: "Profilé",
    name: aSecondReport.name,
    reporterName: aSecondReport.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/dossier-de-nomination/${aSecondReport.id}`,
    onClick,
  };

  const aThirdReport = new ReportBuilder()
    .with("folderNumber", 2)
    .buildListVM();
  const aThirdReportVM: ReportListItemVM = {
    id: aThirdReport.id,
    folderNumber: 2,
    name: aThirdReport.name,
    reporterName: aThirdReport.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/dossier-de-nomination/${aThirdReport.id}`,
    onClick,
  };

  const anotherUserReport = new ReportBuilder()
    .with("id", "another-report-id")
    .with("name", "Another name")
    .with("reporterName", "ANOTHER REPORTER Name")
    .with("dueDate", new DateOnly(2030, 10, 10))
    .buildListVM();
});

const user = {
  email: "username@example.fr",
  password: "password",
  reporterName: "REPORTER Name",
} satisfies AuthenticatedUser & { email: string; password: string };
