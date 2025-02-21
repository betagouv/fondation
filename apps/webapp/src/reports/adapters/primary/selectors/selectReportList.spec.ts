import { NominationFile, Transparency } from "shared-models";
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
    expectStoredReports(selectReports(), []);
  });

  it("shows a report title", () => {
    store.dispatch(listReport.fulfilled([aReport], "", undefined));
    expectStoredReports(selectReports(), [aReportVM]);
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
      expectStoredReports(
        selectReports(aReport.transparency),
        [aReportVM, aThirdReportVM, aSecondReportVM],
        perTransparencyHeaders,
        expectedTransparencyTitle,
      );
    });

    it("selects the sorted list by transparency then folder number", () => {
      expectStoredReports(selectReports(), [
        aReportVM,
        aThirdReportVM,
        aSecondReportVM,
        aFourthDifferentTransparencyReportVM,
      ]);
    });
  });

  const selectReports = (transparency?: Transparency) =>
    selectReportList(store.getState(), transparency, transparencyTitleMap);

  const expectStoredReports = (
    selectedReports: ReportListVM,
    reports: ReportListItemVMSerializable[],
    headers: ReportListVM["headers"] = allHeaders,
    title = [{ text: "Mes rapports" }],
  ) => {
    expect({
      ...selectedReports,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reports: selectedReports.reports.map(({ onClick, ...report }) => report),
    }).toEqual<
      Omit<ReportListVM, "reports"> & {
        reports: ReportListItemVMSerializable[];
      }
    >({
      headers,
      reports,
      title,
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
