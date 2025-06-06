import { colors } from "@codegouvfr/react-dsfr";
import _ from "lodash";
import { Magistrat, Transparency } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../../store/createAppSelector";
import { gradeToLabel } from "../labels/labels-mappers";
import { reportListTableLabels } from "../labels/report-list-table-labels";
import { stateToLabel } from "../labels/state-label.mapper";

export type ReportListItemVM = {
  id: string;
  folderNumber: number | "Profilé";
  state: ReturnType<typeof stateToLabel>;
  dueDate: string | null;
  name: string;
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
      args: {
        transparencyFilter: string;
        aTransparencyTitleMap?: typeof transparencyTitleMap;
        formationFilter: Magistrat.Formation;
      },
    ) => args,
  ],
  (data, getReportAnchorAttributes, args): ReportListVM => {
    const { transparencyFilter, formationFilter } = args;
    let { aTransparencyTitleMap } = args;
    if (!aTransparencyTitleMap) aTransparencyTitleMap = transparencyTitleMap;

    const sortedReports = _.orderBy(
      [...(data || [])],
      [(item) => item.folderNumber],
    );

    const reports = sortedReports
      .filter(({ transparency }) => transparency === transparencyFilter)
      .filter(({ formation }) => formation === formationFilter)
      .map(
        ({
          id,
          folderNumber,
          name,
          dueDate,
          state,
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
            name,
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
      headers: Object.values(reportListTableLabels.headers),
      reports,
      title: [
        {
          text: "Rapports sur la ",
        },
        {
          text:
            transparencyFilter in aTransparencyTitleMap
              ? aTransparencyTitleMap[transparencyFilter]!
              : `transparence ${transparencyFilter}`,
          color: colors.options.yellowTournesol.sun407moon922.hover,
        },
      ],
    };
  },
);

const transparencyTitleMap: { [key in string]: string } = {
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
  [Transparency.DU_30_AVRIL_2025]: "transparence du 30/04/2025",
  [Transparency.MARCH_2026]: "transparence du 21/03/2026",
};
