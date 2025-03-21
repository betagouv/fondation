import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DeleteReportAttachedFileParams = {
  reportId: string;
  fileName: string;
};

export const deleteReportFile = createAppAsyncThunk<
  void,
  DeleteReportAttachedFileParams
>(
  "report/deleteReportFile",
  async (
    args,
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileName } = args;
    return reportGateway.deleteFile(reportId, fileName);
  },
);
