import { Listener } from "../../../store/listeners";
import { attachReportFile } from "../use-cases/report-attach-file/attach-report-file";
import { deleteReportAttachedFile } from "../use-cases/report-attached-file-deletion/delete-report-attached-file";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const reportFileAttached: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: attachReportFile.fulfilled,
    effect: async (action, { dispatch }) => {
      const { reportId, file } = action.meta.arg;

      const resp = await dispatch(
        generateReportFileUrl({
          reportId,
          fileName: file.name,
        }),
      );
      if (
        resp.meta.requestStatus === "fulfilled" &&
        action.meta.addScreenshotToEditor
      ) {
        const success = action.meta.addScreenshotToEditor(
          resp.payload as string,
        );
        if (!success) {
          await dispatch(
            deleteReportAttachedFile({
              reportId,
              fileName: file.name,
            }),
          );
        }
      }
    },
  });
