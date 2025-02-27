import { createAppSelector } from "../../../../store/createAppSelector";

export const selectFetchingReport = createAppSelector(
  [
    (state) => state.reportOverview.queryStatus,
    (_, { reportId }: { reportId: string }) => reportId,
  ],
  (queryStatus, reportId) => {
    const status = queryStatus[reportId];
    return status !== "fulfilled" && status !== "rejected";
  },
);
