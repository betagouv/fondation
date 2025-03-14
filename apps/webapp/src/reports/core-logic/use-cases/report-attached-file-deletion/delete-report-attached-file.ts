import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DeleteReportAttachedFileParams = {
  reportId: string;
  fileName: string;
};

export const deleteReportAttachedFile = createAppAsyncThunk<
  void,
  DeleteReportAttachedFileParams
>(
  "report/deleteReportAttachedFile",
  async (
    args,
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileName } = args;
    return reportGateway.deleteAttachedFile(reportId, fileName);
  },
);
