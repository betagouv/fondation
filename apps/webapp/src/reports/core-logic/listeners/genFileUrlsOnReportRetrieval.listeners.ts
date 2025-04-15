import { Listener } from "../../../store/listeners";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";

export const genFileUrlsOnReportRetrieval: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: retrieveReport.fulfilled,
    effect: async (action, { dispatch }) => {
      const report = action.payload;
      const reportId = report.id;

      if (!report.attachedFiles || report.attachedFiles.length === 0) {
        return;
      }

      report.attachedFiles.forEach(({ fileId }) => {
        if (fileId)
          dispatch(
            generateReportFileUrl({
              reportId,
              fileId,
            }),
          );
      });
    },
  });
