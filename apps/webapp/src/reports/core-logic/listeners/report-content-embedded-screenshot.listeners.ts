import { Listener } from "../../../store/listeners";
import { addScreenshotToEditor } from "../use-cases/add-screenshot-to-editor/add-screenshot-to-editor";
import { reportEmbedScreenshot } from "../use-cases/report-embed-screenshot/report-embed-screenshot";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const reportContentEmbeddedScreenshot: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: reportEmbedScreenshot.fulfilled,
    effect: async (action, { dispatch }) => {
      const { reportId, editor } = action.meta.arg;
      const file = action.payload;

      const resp = await dispatch(
        generateReportFileUrl({
          reportId,
          fileName: file.name,
        }),
      );

      if (resp.meta.requestStatus === "fulfilled") {
        await dispatch(
          addScreenshotToEditor({
            reportId,
            fileName: file.name,
            fileUrl: resp.payload as string,
            editor,
          }),
        );
      }
    },
  });
