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

    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.attachedFiles;
    await Promise.all(
      files.map(fileProvider.assertMimeTypeFactory(acceptedMimeTypes)),
    );

    await reportGateway.uploadFiles(
      reportId,
      files,
      ReportFileUsage.ATTACHMENT,
    );
  },
);
