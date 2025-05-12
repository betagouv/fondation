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
    givenSomeReports(new ReportBuilder().buildListSM());
    selectReports();
    expectTitle(expectedGrandeTranspaTransparencyTitle);
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
        new ReportBuilder()
          .with("state", NominationFile.ReportState.NEW)
          .buildListSM(),
        new ReportBuilder()
          .with("id", "second-new-report-id")
          .with("state", NominationFile.ReportState.NEW)
          .buildListSM(),
        new ReportBuilder()
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
    const aSiegeReport = new ReportBuilder()
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
      const aReport = new ReportBuilder()
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
    });

    it("selects the sorted list by folder number", () => {
      const aReport = new ReportBuilder().with("folderNumber", 1).buildListSM();
      const aSecondReport = new ReportBuilder()
        .with("id", "second-report-id")
        .with("folderNumber", 2)
        .buildListSM();
      const aProfiledReport = new ReportBuilder()
        .with("id", "profiled-report-id")
        .with("folderNumber", null)
        .buildListSM();
      givenSomeReports(aProfiledReport, aReport, aSecondReport);

      selectReports();

      expectStoredReports(
        viewModelFromStoreModel(aReport),
        viewModelFromStoreModel(aSecondReport),
        viewModelFromStoreModel(aProfiledReport),
      );
    });
  });

  const givenSomeReports = (...reports: ReportListItem[]) =>
    store.dispatch(listReport.fulfilled(reports, "", undefined));

  const selectReports = (
    args: {
      transparencyFilter: Transparency;
      formationFilter: Magistrat.Formation;
    } = {
      transparencyFilter: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
      formationFilter: Magistrat.Formation.PARQUET,
    },
  ) => {
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

const transparencyTitleMap: { [key in Transparency]: string } = {
  [Transparency.AUTOMNE_2024]: "",
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]: "",
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]: "",
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]: "",
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]: "",
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: "",
  [Transparency.PARQUET_DU_06_FEVRIER_2025]: "",
  [Transparency.PARQUET_DU_20_FEVRIER_2025]: "",
  [Transparency.DU_03_MARS_2025]: "",
  [Transparency.GRANDE_TRANSPA_DU_21_MARS_2025]: "grande transpa",
  [Transparency.DU_30_AVRIL_2025]: "",
  [Transparency.MARCH_2026]: "",
};

const expectedGrandeTranspaTransparencyTitle = [
  {
    text: "Rapports sur la ",
  },
  {
    text: "grande transpa",
    color: expect.any(String),
  },
];
