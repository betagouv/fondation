import { Magistrat, NominationFile, Transparency } from "shared-models";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { ReportListItem } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import { formationToLabel } from "../labels/labels-mappers";
import {
  GdsFormationVM,
  ReportTransparenciesVM,
  selectTransparencies,
} from "./selectTransparencies";

describe("Select Transparencies", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    routerProvider.onTransparencyClickAttribute = vi.fn();

    store = initReduxStore(
      {},
      {
        routerProvider,
      },
      {},
    );
  });

  it("shows no transparency", () => {
    expectTransparencies({
      noTransparencies: true,
      "GARDE DES SCEAUX": {
        noGdsTransparencies: true,
        formationsCount: 0,
        [Magistrat.Formation.PARQUET]: {
          formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
          transparencies: null,
        },
        [Magistrat.Formation.SIEGE]: {
          formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
          transparencies: null,
        },
      },
    });
  });

  describe("GDS transparencies", () => {
    const testCases: {
      description: string;
      reports: ReportListItem[];
      formationsCount: 0 | 1 | 2;
      expectedTransparencies: Record<
        Magistrat.Formation,
        GdsFormationVM["transparencies"]
      >;
    }[] = [
      {
        description: "reports for the parquet with a supported one",
        reports: [aParquetReport],
        formationsCount: 1,
        expectedTransparencies: {
          PARQUET: [
            {
              label: `T 21/03/2025 (PARQUET_DU_06_FEVRIER_2025)`,
              href: `/transparences/${aParquetReport.transparency}`,
              onClick: expect.any(Function),
            },
          ],

          SIEGE: null,
        },
      },
      {
        description: "reports for the parquet and siège",
        reports: [aParquetReport, aSiegeReport],
        formationsCount: 2,
        expectedTransparencies: {
          PARQUET: [
            {
              label: `T 21/03/2025 (PARQUET_DU_06_FEVRIER_2025)`,
              href: `/transparences/${aParquetReport.transparency}`,
              onClick: expect.any(Function),
            },
          ],
          SIEGE: [
            {
              label: `T 21/03/2025 (SIEGE_DU_06_FEVRIER_2025)`,
              href: `/transparences/${aSiegeReport.transparency}`,
              onClick: expect.any(Function),
            },
          ],
        },
      },
    ];

    describe.each(testCases)(
      `Given $description`,
      ({ reports, formationsCount, expectedTransparencies }) => {
        beforeEach(() => {
          store.dispatch(listReport.fulfilled(reports, "", undefined));
        });

        it("selects the list of transparencies aggregated per formation", () => {
          expectGdsTransparencies(formationsCount, expectedTransparencies);
        });
      },
    );

    it("selects parquet reports on the expected order", () => {
      const firstReport = activeParquetReportBuilder
        .with("dateTransparence", {
          year: 2025,
          month: 1,
          day: 1,
        })
        .buildListSM();
      const secondReport = activeParquetReportBuilder
        .with("id", "second-id")
        .with("dateTransparence", {
          year: 2025,
          month: 2,
          day: 2,
        })
        .buildListSM();

      store.dispatch(
        listReport.fulfilled([firstReport, secondReport], "", undefined),
      );

      expectGdsTransparencies(1, {
        [Magistrat.Formation.PARQUET]: [
          {
            label: `T 02/02/2025 (PARQUET_DU_06_FEVRIER_2025)`,
            href: `/transparences/${secondReport.transparency}`,
            onClick: expect.any(Function),
          },
          {
            label: `T 01/01/2025 (PARQUET_DU_06_FEVRIER_2025)`,
            href: `/transparences/${firstReport.transparency}`,
            onClick: expect.any(Function),
          },
        ],
        [Magistrat.Formation.SIEGE]: null,
      });
    });

    it("can redirect to the 'Parquet' reports", () => {
      store.dispatch(listReport.fulfilled([aParquetReport], "", undefined));
      const clickOnTransparency = getOnClickFromState();

      clickOnTransparency({
        preventDefault: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(routerProvider.onTransparencyClickAttribute).toHaveBeenCalledWith(
        aParquetReport.transparency,
      );
    });

    const getOnClickFromState = () =>
      selectTransparencies(store.getState())["GARDE DES SCEAUX"]["PARQUET"]
        .transparencies![0]!.onClick;

    const expectGdsTransparencies = (
      formationsCount: 0 | 1 | 2,
      expectedTransparencies: {
        [formation in Magistrat.Formation]:
          | GdsFormationVM["transparencies"]
          | null;
      },
    ) =>
      expectTransparencies({
        noTransparencies: false,
        "GARDE DES SCEAUX": {
          noGdsTransparencies: false,
          formationsCount,
          [Magistrat.Formation.PARQUET]: {
            formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
            transparencies: expectedTransparencies[Magistrat.Formation.PARQUET],
          },
          [Magistrat.Formation.SIEGE]: {
            formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
            transparencies: expectedTransparencies[Magistrat.Formation.SIEGE],
          },
        },
      });
  });

  const expectTransparencies = (transparencies: ReportTransparenciesVM) =>
    expect(
      selectTransparencies(store.getState()),
    ).toEqual<ReportTransparenciesVM>(transparencies);
});

const aParquetReport = new ReportBuilder()
  .with("state", NominationFile.ReportState.IN_PROGRESS)
  .with("formation", Magistrat.Formation.PARQUET)
  .with("transparency", Transparency.PARQUET_DU_06_FEVRIER_2025)
  .buildListSM();

const aSiegeReport = new ReportBuilder()
  .with("state", NominationFile.ReportState.NEW)
  .with("formation", Magistrat.Formation.SIEGE)
  .with("transparency", Transparency.SIEGE_DU_06_FEVRIER_2025)
  .buildListSM();

const activeParquetReportBuilder = new ReportBuilder()
  .with("state", NominationFile.ReportState.IN_PROGRESS)
  .with("formation", Magistrat.Formation.PARQUET)
  .with("transparency", Transparency.PARQUET_DU_06_FEVRIER_2025);
