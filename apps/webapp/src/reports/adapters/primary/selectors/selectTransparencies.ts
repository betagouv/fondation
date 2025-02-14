import { Magistrat, NominationFile } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";
import {
  formationToLabel,
  TransparencyLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import { AppState, ReportListItem } from "../../../../store/appState";

export type GdsFormationVM = {
  formationLabel: string;
  transparencies:
    | {
        label: TransparencyLabel;
        href: string;
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
      }[]
    | null;
};

export type ReportTransparenciesVM = {
  noTransparencies: boolean;
  "GARDE DES SCEAUX": {
    noGdsTransparencies: boolean;
    formationsCount: 0 | 1 | 2;
    [Magistrat.Formation.PARQUET]: GdsFormationVM;
    [Magistrat.Formation.SIEGE]: GdsFormationVM;
  };
};

export const selectTransparencies = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.reportList.anchorsAttributes.perTransparency,
  ],
  (data, getTransparencyOnClickAttributes): ReportTransparenciesVM => {
    if (!data)
      return {
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
      };

    const gdsTransparencies = formatGdsTransparencies(
      data,
      getTransparencyOnClickAttributes,
    );
    const noParquetGdsTransparency =
      !gdsTransparencies[Magistrat.Formation.PARQUET] ||
      gdsTransparencies[Magistrat.Formation.PARQUET].length === 0;
    const noSiegeGdsTransparency =
      !gdsTransparencies[Magistrat.Formation.SIEGE] ||
      gdsTransparencies[Magistrat.Formation.SIEGE].length === 0;

    const noGdsTransparencies =
      !gdsTransparencies ||
      (noParquetGdsTransparency && noSiegeGdsTransparency);

    const formationsCount = ((gdsTransparencies[Magistrat.Formation.PARQUET]
      ? 1
      : 0) + (gdsTransparencies[Magistrat.Formation.SIEGE] ? 1 : 0)) as
      | 0
      | 1
      | 2;

    return {
      noTransparencies: noGdsTransparencies,
      "GARDE DES SCEAUX": {
        noGdsTransparencies,
        formationsCount: formationsCount,
        [Magistrat.Formation.PARQUET]: {
          formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
          transparencies: gdsTransparencies[Magistrat.Formation.PARQUET],
        },
        [Magistrat.Formation.SIEGE]: {
          formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
          transparencies: gdsTransparencies[Magistrat.Formation.SIEGE],
        },
      },
    };
  },
);

function formatGdsTransparencies(
  data: ReportListItem[],
  getTransparencyOnClickAttributes: AppState["reportList"]["anchorsAttributes"]["perTransparency"],
) {
  const transparencies = data.reduce(
    (
      acc: {
        [Magistrat.Formation.PARQUET]: NonNullable<
          GdsFormationVM["transparencies"]
        >;
        [Magistrat.Formation.SIEGE]: NonNullable<
          GdsFormationVM["transparencies"]
        >;
      },
      report,
    ) => {
      const transparencyLabel = transparencyToLabel(report.transparency);
      const activeReportInTransparency =
        report.state !== NominationFile.ReportState.SUPPORTED;

      if (activeReportInTransparency) {
        if (report.formation === Magistrat.Formation.PARQUET)
          accumulateTransparency(Magistrat.Formation.PARQUET);
        if (report.formation === Magistrat.Formation.SIEGE)
          accumulateTransparency(Magistrat.Formation.SIEGE);
      }

      return acc;

      function accumulateTransparency(formation: Magistrat.Formation) {
        if (
          acc[formation].findIndex(
            ({ label }) => label === transparencyLabel,
          ) === -1
        ) {
          const anchorAttributes = getTransparencyOnClickAttributes(
            report.transparency,
          );
          acc[formation].push({
            label: transparencyLabel,
            ...anchorAttributes,
          });
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
