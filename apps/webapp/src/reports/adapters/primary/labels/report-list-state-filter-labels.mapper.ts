import { NominationFile } from "shared-models";
import { stateToLabel } from "./state-label.mapper";
import { reportStateFilterTitle } from "./state-filter-labels";

const reportListStateFilters = [
  ...Object.values(NominationFile.ReportState),
  "all",
] as const;

export type ReportListStateFilter = (typeof reportListStateFilters)[number];

const reportListStateFilterLabels = reportListStateFilters.reduce<
  Record<ReportListStateFilter, string>
>(
  (acc, state) => {
    acc[state] = state === "all" ? "Tous" : stateToLabel(state);
    return acc;
  },
  {} as Record<ReportListStateFilter, string>,
);

export const reportListFilters = {
  state: {
    title: reportStateFilterTitle,
    labels: reportListStateFilterLabels,
  },
};
