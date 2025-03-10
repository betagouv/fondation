import { createAppSelector } from "../../../../store/createAppSelector";

export const selectEditor = createAppSelector(
  [
    (state) => state.reportOverview.editorsByIds,
    (_, args: { reportId: string }) => args.reportId,
  ],
  (editorsByIds, reportId) => editorsByIds?.[reportId] || null,
);
