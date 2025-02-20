import _ from "lodash";
import { Transparency } from "shared-models";
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
  reports: ReportListItemVM[];
  headers: string[];
};

export const selectReportList = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.router.anchorsAttributes.reportOverview,
    (_, transparencyFilter?: Transparency) => transparencyFilter,
  ],
  (data, getAnchorAttributes, transparencyFilter): ReportListVM => {
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
          const { href, onClick } = getAnchorAttributes(transparency, id);

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
      headers: Object.entries(reportListTableLabels.headers)
        .filter(([key]) => (transparencyFilter ? key !== "transparency" : true))
        .map(([, value]) => value),
      reports,
    };
  },
);
