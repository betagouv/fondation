import { createAppSelector } from "../../../../store/createAppSelector";
import { reportHtmlIds } from "../dom/html-ids";
import { SummarySection } from "../labels/summary-labels";

export const selectSummary = createAppSelector(
  [
    (state) => state.reportOverview.byIds,
    (state) => state.reportOverview.summarySections,
    (_, reportId: string) => reportId,
  ],
  (byIds, summarySections, reportId): SummarySection[] => {
    const report = byIds?.[reportId];
    if (!report) return [];

    return summarySections.filter(({ anchorId }) => {
      const isObserverSection =
        anchorId === reportHtmlIds.overview.observersSection;
      const isOtherSection = !isObserverSection;
      const hasObservers = !!report.observers?.length;

      return isOtherSection || (isObserverSection && hasObservers);
    });
  },
);
