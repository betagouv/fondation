import { Magistrat, NominationFile, Transparency } from "shared-models";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
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
    selectedReport = selectReports();
    expectStoredReports([]);
  });

  it("shows a report title", () => {
    store.dispatch(listReport.fulfilled([aReport], "", undefined));
    selectedReport = selectReports();
    expectTitle([{ text: "Rapports" }]);
  });

  it("shows the table headers", () => {
    selectedReport = selectReports();
    expectHeaders(allHeaders);
  });

  it("shows that there is no new report", () => {
    selectedReport = selectReports();
    expectNewReportsCount(0);
  });

  describe("When there is two new reports and an in-progress report", () => {
    beforeEach(() => {
      store.dispatch(
        listReport.fulfilled(
          [
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
          ],
          "",
          undefined,
        ),
      );
    });

    it("shows the number of new reports", () => {
      selectedReport = selectReports();
      expectNewReportsCount(2);
    });
  });

  describe("When there is one report with SIEGE formation", () => {
    const aSiegeReport = new ReportBuilder()
      .with("transparency", Transparency.AUTOMNE_2024)
      .with("formation", Magistrat.Formation.SIEGE)
      .buildListSM();

    beforeEach(() => {
      store.dispatch(listReport.fulfilled([aSiegeReport], "", undefined));
    });

    it("filters out the reports of a transparency per a formation SIEGE", () => {
      selectedReport = selectReports({
        transparencyFilter: aSiegeReport.transparency,
        formationFilter: Magistrat.Formation.SIEGE,
      });

      expectStoredReports([
        {
          id: aSiegeReport.id,
          folderNumber: 1,
          name: aSiegeReport.name,
          dueDate: "30/10/2030",
          state: "Nouveau",
          formation: "Siège",
          transparency: "Octobre 2024",
          grade: "I",
          targettedPosition: "PG TJ Marseille",
          observersCount: aSiegeReport.observersCount,
          href: `/transparences/AUTOMNE_2024/dossiers-de-nomination/${aSiegeReport.id}`,
        },
      ]);
    });
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
      selectedReport = selectReports({
        transparencyFilter: aReport.transparency,
      });

      expectStoredReports([aReportVM, aThirdReportVM, aSecondReportVM]);
      expectHeaders(perTransparencyHeaders);
      expectTitle(expectedTransparencyTitle);
    });

    it("selects the sorted list by transparency then folder number", () => {
      selectedReport = selectReports();
      expectStoredReports([
        aReportVM,
        aThirdReportVM,
        aSecondReportVM,
        aFourthDifferentTransparencyReportVM,
      ]);
    });
  });

  const selectReports = (args?: {
    transparencyFilter?: Transparency;
    formationFilter?: Magistrat.Formation;
  }) =>
    selectReportList(store.getState(), {
      aTransparencyTitleMap: transparencyTitleMap,
      ...args,
    });

  const expectStoredReports = (reports: ReportListItemVMSerializable[]) => {
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

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("transparency", Transparency.AUTOMNE_2024)
    .with("folderNumber", 1)
    .with("name", "Banneau Louise")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("state", NominationFile.ReportState.READY_TO_SUPPORT)
    .buildListSM();
  const aReportVM: ReportListItemVMSerializable = {
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
  const aSecondReportVM: ReportListItemVMSerializable = {
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
  const aThirdReportVM: ReportListItemVMSerializable = {
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
  const aFourthDifferentTransparencyReportVM: ReportListItemVMSerializable = {
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

const perTransparencyHeaders: ReportListVM["headers"] = [
  reportListTableLabels.headers.folderNumber,
  reportListTableLabels.headers.magistrate,
  reportListTableLabels.headers.currentGrade,
  reportListTableLabels.headers.targetedPosition,
  reportListTableLabels.headers.status,
  reportListTableLabels.headers.observers,
  reportListTableLabels.headers.deadline,
  reportListTableLabels.headers.formation,
];

const transparencyTitleMap: { [key in Transparency]: string } = {
  [Transparency.AUTOMNE_2024]: "transpa automne 2024",
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]: "",
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]: "",
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]: "",
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]: "",
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: "",
  [Transparency.PARQUET_DU_06_FEVRIER_2025]: "",
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
