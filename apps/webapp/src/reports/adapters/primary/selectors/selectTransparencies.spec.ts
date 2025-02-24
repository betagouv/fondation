import { Magistrat, NominationFile, Transparency } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import {
  formationToLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import {
  GdsFormationVM,
  ReportTransparenciesVM,
  selectTransparencies,
} from "./selectTransparencies";
import { ReportListItem } from "../../../../store/appState";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";

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
    expect(
      selectTransparencies(store.getState()),
    ).toEqual<ReportTransparenciesVM>({
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
        reports: [aParquetReport, aSupportedParquetReport],
        formationsCount: 1,
        expectedTransparencies: {
          PARQUET: [
            {
              label: transparencyToLabel(aParquetReport.transparency),
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
              label: transparencyToLabel(aParquetReport.transparency),
              href: `/transparences/${aParquetReport.transparency}`,
              onClick: expect.any(Function),
            },
          ],
          SIEGE: [
            {
              label: transparencyToLabel(aSiegeReport.transparency),
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
          expect(
            selectTransparencies(store.getState()),
          ).toEqual<ReportTransparenciesVM>({
            noTransparencies: false,
            "GARDE DES SCEAUX": {
              noGdsTransparencies: false,
              formationsCount,
              [Magistrat.Formation.PARQUET]: {
                formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
                transparencies:
                  expectedTransparencies[Magistrat.Formation.PARQUET],
              },
              [Magistrat.Formation.SIEGE]: {
                formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
                transparencies:
                  expectedTransparencies[Magistrat.Formation.SIEGE],
              },
            },
          });
        });
      },
    );

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
  });
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

const aSupportedParquetReport = new ReportBuilder()
  .with("state", NominationFile.ReportState.SUPPORTED)
  .with("formation", Magistrat.Formation.PARQUET)
  .with("transparency", Transparency.AUTOMNE_2024)
  .buildListSM();
