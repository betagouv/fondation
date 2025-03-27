import { colors } from "@codegouvfr/react-dsfr";
import _ from "lodash";
import { Magistrat, Transparency } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../../store/createAppSelector";
import { transparenciesOrder } from "../../../core-logic/transparencies-order";
import {
  formationToLabel,
  gradeToLabel,
  TransparencyLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import {
  ReportListTableLabels,
  reportListTableLabels,
} from "../labels/report-list-table-labels";
import { stateToLabel } from "../labels/state-label.mapper";

export type ReportListItemVM = {
  id: string;
  folderNumber: number | "Profilé";
  state: ReturnType<typeof stateToLabel>;
  dueDate: string | null;
  formation: ReturnType<typeof formationToLabel>;
  name: string;
  transparency: TransparencyLabel;
  grade: ReturnType<typeof gradeToLabel>;
  targettedPosition: string;
  observersCount: number;
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

type HeadersKey = keyof ReportListTableLabels["headers"];

export type ReportListVM = {
  newReportsCount: number;
  reports: ReportListItemVM[];
  headers: string[];
  title: { text: string; color?: string }[];
};

export const selectReportList = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.router.anchorsAttributes.reportOverview,
    (
      _,
      args?: {
        transparencyFilter?: Transparency;
        aTransparencyTitleMap?: typeof transparencyTitleMap;
        formationFilter?: Magistrat.Formation;
      },
    ) => args,
  ],
  (data, getReportAnchorAttributes, args): ReportListVM => {
    const { transparencyFilter, formationFilter } = args || {};
    let { aTransparencyTitleMap } = args || {};
    if (!aTransparencyTitleMap) aTransparencyTitleMap = transparencyTitleMap;

    const sortedReports = _.orderBy(
      [...(data || [])],
      [
        (item) => transparenciesOrder.indexOf(item.transparency),
        (item) => item.folderNumber,
      ],
    );

    const reports = sortedReports
      .filter(({ transparency }) =>
        transparencyFilter ? transparency === transparencyFilter : true,
      )
      .filter(({ formation }) =>
        formationFilter ? formation === formationFilter : true,
      )
      .map(
        ({
          id,
          folderNumber,
          name,
          dueDate,
          state,
          formation,
          transparency,
          grade,
          targettedPosition,
          observersCount,
        }) => {
          const { href, onClick } = getReportAnchorAttributes(transparency, id);

          const dueDateFormatted = dueDate
            ? new DateOnly(
                dueDate.year,
                dueDate.month,
                dueDate.day,
              ).toFormattedString()
            : null;

          return {
            id,
            folderNumber: folderNumber ?? "Profilé",
            state: stateToLabel(state),
            dueDate: dueDateFormatted,
            formation: formationToLabel(formation),
            name,
            transparency: transparencyToLabel(transparency),
            grade: gradeToLabel(grade),
            targettedPosition,
            observersCount,
            href,
            onClick,
          } as const;
        },
      );

    return {
      newReportsCount: _.sumBy(reports, (report) =>
        report.state === "Nouveau" ? 1 : 0,
      ),
      headers: Object.entries(reportListTableLabels.headers)
        .filter(([key]) =>
          transparencyFilter ? (key as HeadersKey) !== "transparency" : true,
        )
        .filter(([key]) =>
          formationFilter ? (key as HeadersKey) !== "formation" : true,
        )
        .map(([, value]) => value),
      reports,
      title: transparencyFilter
        ? [
            {
              text: "Rapports sur la ",
            },
            {
              text: aTransparencyTitleMap[transparencyFilter],
              color: colors.options.yellowTournesol.sun407moon922.hover,
            },
          ]
        : [{ text: "Rapports" }],
    };
  },
);

const transparencyTitleMap: { [key in Transparency]: string } = {
  [Transparency.AUTOMNE_2024]: "transparence du 18/10/2024 (automne)",
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]:
    "transparence du 08/11/2024 (PG/PR)",
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]:
    "transparence du 25/11/2024",
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]:
    "transparence du 25/11/2024 (Mamoudzou)",
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]:
    "transparence du 21/01/2025 (cabinet GDS)",
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: "transparence du 06/02/2025",
  [Transparency.PARQUET_DU_06_FEVRIER_2025]: "transparence du 06/02/2025",
  [Transparency.PARQUET_DU_20_FEVRIER_2025]: "transparence du 20/02/2025",
  [Transparency.DU_03_MARS_2025]: "transparence du 03/03/2025",
  [Transparency.GRANDE_TRANSPA_DU_21_MARS_2025]:
    "transparence du 21/03/2025 (annuelle)",
  [Transparency.MARCH_2026]: "transparence du 21/03/2026",
};
