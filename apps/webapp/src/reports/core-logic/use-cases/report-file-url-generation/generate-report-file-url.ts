import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const generateReportFileUrl = createAppAsyncThunk(
  "report/generateReportFileUrl",
  async (
    { reportId, fileName }: { reportId: string; fileName: string },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    return reportGateway.generateFileUrl(reportId, fileName);
  },
);
