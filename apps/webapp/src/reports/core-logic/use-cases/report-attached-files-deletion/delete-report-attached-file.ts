import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DeleteReportAttachedFileParams = {
  reportId: string;
  fileNames: string[];
  addScreenshotToEditor?: (arg: {
    fileUrl: string;
    fileName: string;
  }) => boolean;
};

export const deleteReportAttachedFiles = createAppAsyncThunk<
  void,
  DeleteReportAttachedFileParams
>(
  "report/deleteReportAttachedFiles",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileNames } = args;
    try {
      await reportGateway.deleteAttachedFiles(reportId, fileNames);
    } catch {
      if (args.addScreenshotToEditor) {
        const state = getState();

        for (const fileName of fileNames) {
          const file = state.reportOverview.byIds?.[
            reportId
          ]?.attachedFiles?.find((f) => f.name === fileName);
          if (file?.signedUrl)
            args.addScreenshotToEditor({ fileUrl: file.signedUrl, fileName });
        }
      }
    }
  },
);
