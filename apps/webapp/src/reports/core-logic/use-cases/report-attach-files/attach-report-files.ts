import { ReportFileUsage } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type AttachReportFilesParams = {
  reportId: string;
  files: File[];
};

export const attachReportFiles = createAppAsyncThunk<
  {
    file: File;
    fileId: string;
  }[],
  AttachReportFilesParams
>(
  "report/attachFiles",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider, uuidGenerator },
      },
    },
  ) => {
    const { reportId, files } = args;

    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.attachedFiles;
    await Promise.all(
      files.map(fileProvider.assertMimeTypeFactory(acceptedMimeTypes)),
    );

    const filesArg = files.map((file) => ({
      file,
      fileId: uuidGenerator.generate(),
    }));

    await reportGateway.uploadFiles(
      reportId,
      filesArg,
      ReportFileUsage.ATTACHMENT,
    );

    return filesArg;
  },
);
