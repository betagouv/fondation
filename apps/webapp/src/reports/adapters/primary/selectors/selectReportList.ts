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
import { stateToLabel } from "../labels/state-label.mapper";
import { ReportListStateFilter } from "../labels/report-list-state-filter-labels.mapper";

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
  onClick: () => void;
};

export type ReportListVM = {
  reports: ReportListItemVM[];
  filters: {
    state: ReportListStateFilter;
  };
};

export const selectReportList = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.router.anchorsAttributes.reportOverview,
    (state) => state.reportList.filters,
  ],
  (data, getAnchorAttributes, filters): ReportListVM => {
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

    const { state: reportState } = filters;

    const sortedReports = _.orderBy(
      [...(data || [])],
      [
        (item) => transparencyOrder.indexOf(item.transparency),
        (item) => item.folderNumber,
      ],
    );

    const reports = sortedReports
      .filter(({ state }) => (reportState ? state === reportState : true))
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
          const { href, onClick } = getAnchorAttributes(id);

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
      reports,
      filters: {
        state: reportState ?? "all",
      },
    };
  },
);
