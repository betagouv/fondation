import { ReportSM } from "../../../store/appState";
import { createAppSelector } from "../../../store/createAppSelector";

export const selectReportAttachedFiles = createAppSelector(
  [(state) => state.reportOverview.byIds, (_, id: string) => id],
  (byIds, id): ReportSM["attachedFiles"] => {
    const report = byIds?.[id];
    if (!report) return null;

    return report.attachedFiles;
  },
);
