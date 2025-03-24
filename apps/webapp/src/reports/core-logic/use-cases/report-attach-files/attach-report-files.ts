import { ReportFileUsage } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type AttachReportFilesParams = {
  reportId: string;
  files: File[];
};

export const attachReportFiles = createAppAsyncThunk<
  void,
  AttachReportFilesParams
>(
  "report/attachFiles",
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
    const { reportId, files } = args;

    const assertFileMimeType = async (file: File) => {
      const fileBuffer = await fileProvider.bufferFromFile(file);
      const mimeType = await fileProvider.mimeTypeFromBuffer(fileBuffer);
      const acceptedMimeTypes =
        getState().reportOverview.acceptedMimeTypes.attachedFiles;

      if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
        throw new Error(
          `Invalid mime type for file ${file.name}: ${mimeType || ""}`,
        );
      }
    };
    await Promise.all(files.map(assertFileMimeType));

    await reportGateway.uploadFiles(
      reportId,
      files,
      ReportFileUsage.ATTACHMENT,
    );
  },
);
