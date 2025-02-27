import { Listener } from "../../../store/listeners";
import { listReport } from "../use-cases/report-listing/listReport.use-case";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";

export const preloadReportsRetrieval: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: listReport.fulfilled,
    effect: async (action, { dispatch }) => {
      const retrieveReportsPromises = action.payload.map((report) =>
        dispatch(retrieveReport(report.id)),
      );
      await Promise.all(retrieveReportsPromises);
    },
  });
