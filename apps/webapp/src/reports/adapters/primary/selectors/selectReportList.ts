import { colors } from "@codegouvfr/react-dsfr";
import _ from "lodash";
import { Magistrat, Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../../store/createAppSelector";
import {
  formationToLabel,
  gradeToLabel,
  TransparencyLabel,
  transparencyToLabel,
} from "../labels/labels-mappers";
import { reportListTableLabels } from "../labels/report-list-table-labels";
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

    const transparencyOrder: UnionToTuple<Transparency> = [
      Transparency.AUTOMNE_2024,
      Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
      Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
      Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
      Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025,
      Transparency.SIEGE_DU_06_FEVRIER_2025,
      Transparency.PARQUET_DU_06_FEVRIER_2025,
      Transparency.MARCH_2025,
      Transparency.MARCH_2026,
    ];

    const sortedReports = _.orderBy(
      [...(data || [])],
      [
        (item) => transparencyOrder.indexOf(item.transparency),
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
        .filter(([key]) => (transparencyFilter ? key !== "transparency" : true))
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
  [Transparency.AUTOMNE_2024]: "transparence d'automne 2024",
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]:
    "transparence PG du 08/11/2024",
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]:
    "transparence PG du 25/11/2024",
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]:
    "transparence du 25/11/2024",
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]:
    "transparence du 21/01/2025",
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: "transparence siège du 06/02/2025",
  [Transparency.PARQUET_DU_06_FEVRIER_2025]:
    "transparence parquet du 06/02/2025",
  [Transparency.MARCH_2025]: "transparence de mars 2025",
  [Transparency.MARCH_2026]: "transparence de mars 2026",
};
