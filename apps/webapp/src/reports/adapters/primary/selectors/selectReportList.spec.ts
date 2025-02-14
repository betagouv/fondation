import { NominationFile, Transparency } from "shared-models";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { reportsFilteredByState } from "../../../core-logic/reducers/reportList.slice";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import { reportListTableLabels } from "../labels/report-list-table-labels";
import {
  ReportListItemVM,
  ReportListVM,
  selectReportList,
} from "./selectReportList";

describe("Select Report List", () => {
  let store: ReduxStore;
  const onClick = () => null;

  beforeEach(() => {
    const stubRouterProvider = new StubRouterProvider();
    stubRouterProvider.onReportOverviewClick = onClick;
    store = initReduxStore(
      {},
      {
        routerProvider: stubRouterProvider,
      },
      {},
    );
  });

  it("shows an empty list", () => {
    expectReports([]);
  });

  describe("when there are many reports", () => {
    beforeEach(() => {
      store.dispatch(
        listReport.fulfilled(
          [aReport, aDifferentTransparencyReport, aSecondReport, aThirdReport],
          "",
          undefined,
        ),
      );
    });

    it("filters out the reports of a transparency", () => {
      const headers: ReportListVM["headers"] = [
        reportListTableLabels.headers.folderNumber,
        reportListTableLabels.headers.formation,
        reportListTableLabels.headers.status,
        reportListTableLabels.headers.deadline,
        reportListTableLabels.headers.magistrate,
        reportListTableLabels.headers.currentGrade,
        reportListTableLabels.headers.targetedPosition,
        reportListTableLabels.headers.observers,
      ];
      expectReports(
        [aReportVM, aThirdReportVM, aSecondReportVM],
        undefined,
        headers,
        aReport.transparency,
      );
    });

    it("selects the sorted list by transparency then folder number", () => {
      expectReports([
        aReportVM,
        aThirdReportVM,
        aSecondReportVM,
        aFourthDifferentTransparencyReportVM,
      ]);
    });

    it("filters the reports ready to support", () => {
      store.dispatch(
        reportsFilteredByState(NominationFile.ReportState.READY_TO_SUPPORT),
      );
      expectReports([aReportVM], {
        state: NominationFile.ReportState.READY_TO_SUPPORT,
      });
    });

    it("resets the state filter", () => {
      store.dispatch(
        reportsFilteredByState(NominationFile.ReportState.READY_TO_SUPPORT),
      );
      store.dispatch(reportsFilteredByState("all"));

      expectReports([
        aReportVM,
        aThirdReportVM,
        aSecondReportVM,
        aFourthDifferentTransparencyReportVM,
      ]);
    });
  });

  const expectReports = (
    reports: Omit<ReportListItemVM, "onClick">[],
    filters: ReportListVM["filters"] = {
      state: "all",
    },
    headers: ReportListVM["headers"] = allHeaders,
    transparency?: Transparency,
  ) => {
    const state = selectReportList(store.getState(), transparency);
    expect({
      ...state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reports: state.reports.map(({ onClick, ...report }) => ({
        ...report,
      })),
    }).toEqual<
      Omit<ReportListVM, "reports"> & {
        reports: Omit<ReportListItemVM, "onClick">[];
      }
    >({
      headers,
      reports,
      filters,
    });
  };

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("transparency", Transparency.AUTOMNE_2024)
    .with("folderNumber", 1)
    .with("name", "Banneau Louise")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("state", NominationFile.ReportState.READY_TO_SUPPORT)
    .buildListSM();
  const aReportVM: Omit<ReportListItemVM, "onClick"> = {
    id: aReport.id,
    folderNumber: 1,
    name: aReport.name,
    dueDate: "30/10/2030",
    state: "Prêt à soutenir",
    formation: "Parquet",
    transparency: "Octobre 2024",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/transparences/AUTOMNE_2024/dossiers-de-nomination/${aReport.id}`,
  };

  const aSecondReport = new ReportBuilder()
    .with("id", "report-id")
    .with("transparency", Transparency.AUTOMNE_2024)
    .with("folderNumber", null)
    .with("name", "Denan Lucien")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListSM();
  const aSecondReportVM: Omit<ReportListItemVM, "onClick"> = {
    id: aSecondReport.id,
    folderNumber: "Profilé",
    name: aSecondReport.name,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Octobre 2024",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/transparences/AUTOMNE_2024/dossiers-de-nomination/${aSecondReport.id}`,
  };

  const aThirdReport = new ReportBuilder()
    .with("folderNumber", 2)
    .with("transparency", Transparency.AUTOMNE_2024)
    .buildListSM();
  const aThirdReportVM: Omit<ReportListItemVM, "onClick"> = {
    id: aThirdReport.id,
    folderNumber: 2,
    name: aThirdReport.name,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Octobre 2024",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/transparences/AUTOMNE_2024/dossiers-de-nomination/${aThirdReport.id}`,
  };

  const aDifferentTransparencyReport = new ReportBuilder()
    .with("folderNumber", 1)
    .with("transparency", Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
    .buildListSM();
  const aFourthDifferentTransparencyReportVM: Omit<
    ReportListItemVM,
    "onClick"
  > = {
    id: aDifferentTransparencyReport.id,
    folderNumber: 1,
    name: aDifferentTransparencyReport.name,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "PG 8/11/2024",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aReport.observersCount,
    href: `/transparences/PROCUREURS_GENERAUX_8_NOVEMBRE_2024/dossiers-de-nomination/${aDifferentTransparencyReport.id}`,
  };
});

const allHeaders = Object.values(reportListTableLabels.headers);
