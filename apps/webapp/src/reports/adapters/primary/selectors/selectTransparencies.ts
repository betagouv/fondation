import { Magistrat, NominationFile } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";
import {
  formationToLabel,
  TransparencyLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import { ReportListItem } from "../../../../store/appState";

export type ReportTransparenciesVM = {
  noTransparencies: boolean;
  "GARDE DES SCEAUX": {
    noGdsTransparencies: boolean;

    [Magistrat.Formation.PARQUET]: {
      label: string;
      values: TransparencyLabel[] | null;
    };
    [Magistrat.Formation.SIEGE]: {
      label: string;
      values: TransparencyLabel[] | null;
    };
  };
};

export const selectTransparencies = createAppSelector(
  [(state) => state.reportList.data],
  (data): ReportTransparenciesVM => {
    if (!data)
      return {
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
      };

    const gdsTransparencies = formatGdsTransparencies(data);
    const noParquetGdsTransparency =
      !gdsTransparencies[Magistrat.Formation.PARQUET] ||
      gdsTransparencies[Magistrat.Formation.PARQUET].length === 0;
    const noSiegeGdsTransparency =
      !gdsTransparencies[Magistrat.Formation.SIEGE] ||
      gdsTransparencies[Magistrat.Formation.SIEGE].length === 0;

    const noGdsTransparencies =
      !gdsTransparencies ||
      (noParquetGdsTransparency && noSiegeGdsTransparency);

    return {
      noTransparencies: noGdsTransparencies,
      "GARDE DES SCEAUX": {
        noGdsTransparencies,
        [Magistrat.Formation.PARQUET]: {
          label: formationToLabel(Magistrat.Formation.PARQUET),
          values: gdsTransparencies[Magistrat.Formation.PARQUET],
        },
        [Magistrat.Formation.SIEGE]: {
          label: formationToLabel(Magistrat.Formation.SIEGE),
          values: gdsTransparencies[Magistrat.Formation.SIEGE],
        },
      },
    };
  },
);

function formatGdsTransparencies(data: ReportListItem[]) {
  const transparencies = data.reduce(
    (
      acc: {
        [Magistrat.Formation.PARQUET]: TransparencyLabel[];
        [Magistrat.Formation.SIEGE]: TransparencyLabel[];
      },
      report,
    ) => {
      const transparencyLabel = transparencyToLabel(report.transparency);
      const activeReportInTransparency =
        report.state !== NominationFile.ReportState.SUPPORTED;

      if (activeReportInTransparency) {
        accumulateTransparency(Magistrat.Formation.PARQUET);
        accumulateTransparency(Magistrat.Formation.SIEGE);
      }

      return acc;

      function accumulateTransparency(formation: Magistrat.Formation) {
        if (
          report.formation === formation &&
          !acc[formation].includes(transparencyLabel)
        ) {
          acc[formation].push(transparencyLabel);
        }
      }
    },
    {
      [Magistrat.Formation.PARQUET]: [],
      [Magistrat.Formation.SIEGE]: [],
    },
  );

  const toNullableTransparencyGroup = (formation: Magistrat.Formation) =>
    transparencies[formation].length ? transparencies[formation] : null;

  return {
    [Magistrat.Formation.PARQUET]: toNullableTransparencyGroup(
      Magistrat.Formation.PARQUET,
    ),
    [Magistrat.Formation.SIEGE]: toNullableTransparencyGroup(
      Magistrat.Formation.SIEGE,
    ),
  };
}
