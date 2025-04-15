import { Listener } from "../../../store/listeners";
import { attachReportFiles } from "../use-cases/report-attach-files/attach-report-files";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const reportFilesAttached: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: attachReportFiles.fulfilled,
    effect: async (action, { dispatch }) => {
      const { reportId } = action.meta.arg;
      const files = action.payload;

      files.forEach(({ fileId }) =>
        dispatch(
          generateReportFileUrl({
            reportId,
            fileId,
          }),
        ),
      );
    },
  });
