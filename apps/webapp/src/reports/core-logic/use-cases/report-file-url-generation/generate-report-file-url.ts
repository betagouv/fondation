import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export const generateReportFileUrl = createAppAsyncThunk(
  "report/generateReportFileUrl",
  async (
    { fileId }: { reportId: string; fileId: string },
    {
      extra: {
        gateways: { fileGateway },
      },
    },
  ) => {
    const fileVMs = await fileGateway.getSignedUrls([fileId]);
    return fileVMs[0]!.signedUrl;
  },
);
