import { NominationFile } from "shared-models";
import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export type UpdateReportParams = {
  reportId: string;
  data: {
    comment?: string;
    state?:
      | NominationFile.ReportState.IN_PROGRESS
      | NominationFile.ReportState.READY_TO_SUPPORT;
  };
};
export type UpdateReportPayload = UpdateReportParams;

export const updateReport = createAppAsyncThunk<
  UpdateReportPayload,
  UpdateReportParams
>(
  "report/updateFile",
  async (
    { reportId, data },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    await reportGateway.updateReport(reportId, data);
    return { reportId, data };
  },
);
