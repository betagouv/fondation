import { Magistrat, NominationFile, Transparency } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { listReport } from "../../../core-logic/use-cases/report-listing/listReport.use-case";
import {
  formationToLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import {
  ReportTransparenciesVM,
  selectTransparencies,
} from "./selectTransparencies";

describe("Select Transparencies", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("shows no transparency", () => {
    expect(
      selectTransparencies(store.getState()),
    ).toEqual<ReportTransparenciesVM>({
      noTransparencies: true,
      "GARDE DES SCEAUX": {
        noGdsTransparencies: true,
        [Magistrat.Formation.PARQUET]: {
          label: formationToLabel(Magistrat.Formation.PARQUET),
          values: null,
        },
        [Magistrat.Formation.SIEGE]: {
          label: formationToLabel(Magistrat.Formation.SIEGE),
          values: null,
        },
      },
    });
  });

  describe("GDS transparencies", () => {
    describe.each`
      description                                       | reports                                      | expectedTransparencies
      ${"reports for the parquet with a supported one"} | ${[aParquetReport, aSupportedParquetReport]} | ${{ PARQUET: [transparencyToLabel(aParquetReport.transparency)], SIEGE: null }}
      ${"reports for the parquet and siège"}            | ${[aParquetReport, aSiegeReport]}            | ${{ PARQUET: [transparencyToLabel(aParquetReport.transparency)], SIEGE: [transparencyToLabel(aSiegeReport.transparency)] }}
    `("Given $description", ({ reports, expectedTransparencies }) => {
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
            [Magistrat.Formation.PARQUET]: {
              label: formationToLabel(Magistrat.Formation.PARQUET),
              values: expectedTransparencies[Magistrat.Formation.PARQUET],
            },
            [Magistrat.Formation.SIEGE]: {
              label: formationToLabel(Magistrat.Formation.SIEGE),
              values: expectedTransparencies[Magistrat.Formation.SIEGE],
            },
          },
        });
      });
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
});
