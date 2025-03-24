import { Listener } from "../../../store/listeners";
import { attachReportFiles } from "../use-cases/report-attach-files/attach-report-files";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const reportFilesAttached: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: attachReportFiles.fulfilled,
    effect: async (action, { dispatch }) => {
      const { reportId, files } = action.meta.arg;

      files.forEach((file) =>
        dispatch(
          generateReportFileUrl({
            reportId,
            fileName: file.name,
          }),
        ),
      );
    },
  });
