import { Magistrat, NominationFile, Transparency } from "shared-models";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { ReportListItem } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportListItemVMBuilder } from "../../../core-logic/builders/ReportListItemVM.builder";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import { reportListTableLabels } from "../labels/report-list-table-labels";
import {
  ReportListItemVM,
  ReportListVM,
  selectReportList,
} from "./selectReportList";

type ReportListItemVMSerializable = Omit<ReportListItemVM, "onClick">;

describe("Select Report List", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  const onClick = () => null;
  let selectedReport: ReportListVM;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    routerProvider.onReportOverviewClick = onClick;
    store = initReduxStore(
      {},
      {
        routerProvider,
      },
      {},
    );
  });

  it("shows an empty list", () => {
    selectReports();
    expectStoredReports();
  });

  it("shows a report title", () => {
    givenSomeReports(reportBuilder.buildListSM());
    selectReports();
    expectTitle([{ text: "Rapports" }]);
  });

  it("shows the table headers", () => {
    selectReports();
    expectHeaders(allHeaders);
  });

  it("shows that there is no new report", () => {
    selectReports();
    expectNewReportsCount(0);
  });

  describe("When there is two new reports and an in-progress report", () => {
    beforeEach(() => {
      givenSomeReports(
        reportBuilder
          .with("state", NominationFile.ReportState.NEW)
          .buildListSM(),
        reportBuilder
          .with("id", "second-new-report-id")
          .with("state", NominationFile.ReportState.NEW)
          .buildListSM(),
        reportBuilder
          .with("id", "in-progress-report-id")
          .with("state", NominationFile.ReportState.IN_PROGRESS)
          .buildListSM(),
      );
    });

    it("shows the number of new reports", () => {
      selectReports();
      expectNewReportsCount(2);
    });
  });

  describe("When there is one report with SIEGE formation", () => {
    const aSiegeReport = reportBuilder
      .with("transparency", Transparency.AUTOMNE_2024)
      .with("formation", Magistrat.Formation.SIEGE)
      .buildListSM();

    beforeEach(() => {
      givenSomeReports(aSiegeReport);
    });

    it("filters out the reports of a transparency per a formation SIEGE", () => {
      selectReports({
        transparencyFilter: aSiegeReport.transparency,
        formationFilter: Magistrat.Formation.SIEGE,
      });
      expectStoredReports(viewModelFromStoreModel(aSiegeReport));
    });
  });

  describe("when there are many reports", () => {
    it("filters out the reports of a transparency", () => {
      const aReport = reportBuilder
        .with("transparency", Transparency.AUTOMNE_2024)
        .buildListSM();
      const aDifferentTransparencyReport = ReportBuilder.duplicate(aReport)
        .with("transparency", Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
        .buildListSM();
      givenSomeReports(aReport, aDifferentTransparencyReport);

      selectReports({
        transparencyFilter: aReport.transparency,
        formationFilter: aReport.formation,
      });

      expectStoredReports(viewModelFromStoreModel(aReport));
      expectHeaders(perTransparencyAndFormationHeaders);
      expectTitle(expectedTransparencyTitle);
    });

    it("selects the sorted list by transparency then folder number", () => {
      const aReport = reportBuilder
        .with("folderNumber", 1)
        .with("transparency", Transparency.AUTOMNE_2024)
        .buildListSM();
      const aDifferentTransparencyReport = reportBuilder
        .with("id", "different-transparency-report-id")
        .with("folderNumber", 1)
        .with("transparency", Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
        .buildListSM();
      const aProfiledReport = ReportBuilder.duplicate(aReport)
        .with("folderNumber", null)
        .buildListSM();
      givenSomeReports(aProfiledReport, aReport, aDifferentTransparencyReport);

      selectReports();

      expectStoredReports(
        viewModelFromStoreModel(aReport),
        viewModelFromStoreModel(aProfiledReport),
        viewModelFromStoreModel(aDifferentTransparencyReport),
      );
    });
  });

  const givenSomeReports = (...reports: ReportListItem[]) =>
    store.dispatch(listReport.fulfilled(reports, "", undefined));

  const selectReports = (args?: {
    transparencyFilter?: Transparency;
    formationFilter?: Magistrat.Formation;
  }) => {
    selectedReport = selectReportList(store.getState(), {
      aTransparencyTitleMap: transparencyTitleMap,
      ...args,
    });
  };

  const expectStoredReports = (...reports: ReportListItemVMSerializable[]) => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      selectedReport.reports.map(({ onClick, ...report }) => report),
    ).toEqual<ReportListItemVMSerializable[]>(reports);
  };

  const expectNewReportsCount = (count: number) =>
    expect(selectedReport.newReportsCount).toBe(count);

  const expectTitle = (title: ReportListVM["title"]) =>
    expect(selectedReport.title).toEqual(title);

  const expectHeaders = (headers: ReportListVM["headers"]) =>
    expect(selectedReport.headers).toEqual(headers);

  const viewModelFromStoreModel = (report: ReportListItem) =>
    ReportListItemVMBuilder.fromStoreModel(report).buildSerializable();
});

const allHeaders = Object.values(reportListTableLabels.headers);

const perTransparencyAndFormationHeaders: ReportListVM["headers"] = [
  reportListTableLabels.headers.folderNumber,
  reportListTableLabels.headers.magistrate,
  reportListTableLabels.headers.currentGrade,
  reportListTableLabels.headers.targetedPosition,
  reportListTableLabels.headers.status,
  reportListTableLabels.headers.observers,
  reportListTableLabels.headers.deadline,
];

const transparencyTitleMap: { [key in Transparency]: string } = {
  [Transparency.AUTOMNE_2024]: "transpa automne 2024",
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]: "",
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]: "",
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]: "",
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]: "",
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: "",
  [Transparency.PARQUET_DU_06_FEVRIER_2025]: "",
  [Transparency.PARQUET_DU_20_FEVRIER_2025]: "",
  [Transparency.MARCH_2025]: "",
  [Transparency.MARCH_2026]: "",
};

const expectedTransparencyTitle = [
  {
    text: "Rapports sur la ",
  },
  {
    text: "transpa automne 2024",
    color: expect.any(String),
  },
];

const reportBuilder = new ReportBuilder();
