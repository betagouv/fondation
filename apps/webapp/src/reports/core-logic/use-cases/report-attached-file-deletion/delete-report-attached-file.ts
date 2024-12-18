import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export const deleteReportAttachedFile = createAppAsyncThunk(
  "report/deleteReportAttachedFile",
  async (
    { reportId, fileName }: { reportId: string; fileName: string },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    await reportGateway.deleteAttachedFile(reportId, fileName);
  },
);
