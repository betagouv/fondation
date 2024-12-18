import { Listener } from "../../../store/listeners";
import { attachReportFile } from "../use-cases/report-attach-file/attach-report-file";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const reportFileAttached: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: attachReportFile.fulfilled,
    effect: async (action, { dispatch }) => {
      const { reportId, file } = action.meta.arg;
      await dispatch(
        generateReportFileUrl({
          reportId,
          fileName: file.name,
        }),
      );
    },
  });
