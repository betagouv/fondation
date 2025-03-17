import { ReportFileUsage } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type AttachReportFileParams = {
  reportId: string;
  file: File;
};

export const attachReportFile = createAppAsyncThunk<
  void,
  AttachReportFileParams
>(
  "report/attachFile",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider },
      },
    },
  ) => {
    const { reportId, file } = args;
    const fileBuffer = await fileProvider.bufferFromFile(file);

    const mimeType = await fileProvider.mimeTypeFromBuffer(fileBuffer);
    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.attachedFiles;

    if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType || ""}`);
    }

    await reportGateway.uploadFile(reportId, file, ReportFileUsage.ATTACHMENT);
  },
);
