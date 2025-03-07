import { NominationFile } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type ReportStateUpdateParam = NominationFile.ReportState;

export type UpdateReportParams = {
  reportId: string;
  data: {
    comment?: string;
    state?: ReportStateUpdateParam;
  };
};
export type UpdateReportPayload = UpdateReportParams;

export const updateReport = createAppAsyncThunk<
  UpdateReportPayload,
  UpdateReportParams
>(
  "report/update",
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
