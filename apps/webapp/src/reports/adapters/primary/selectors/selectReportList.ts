import _ from "lodash";
import { Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../store/createAppSelector";
import {
  formationToLabel,
  gradeToLabel,
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
  reporterName: string | null;
  transparency: ReturnType<typeof transparencyToLabel>;
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
    (state) => state.authentication.user,
    (state) => state.reportList.filters,
  ],
  (data, getAnchorAttributes, user, filters): ReportListVM => {
    const transparencyOrder: UnionToTuple<Transparency> = [
      Transparency.AUTOMNE_2024,
      Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
      Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
      Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
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
      .filter(({ reporterName }) =>
        user ? reporterName === user.reporterName : false,
      )
      .filter(({ state }) => (reportState ? state === reportState : true))
      .map(
        ({
          id,
          folderNumber,
          name,
          reporterName,
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
            reporterName,
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
