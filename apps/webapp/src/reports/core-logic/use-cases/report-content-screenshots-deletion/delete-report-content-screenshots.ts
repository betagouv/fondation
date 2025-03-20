import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DeleteReportContentScreenshotsParams = {
  reportId: string;
  fileNames: string[];
  addScreenshotToEditor: (arg: {
    fileUrl: string;
    fileName: string;
  }) => boolean;
};

export const deleteReportContentScreenshots = createAppAsyncThunk<
  void,
  DeleteReportContentScreenshotsParams
>(
  "report/deleteReportContentScreenshots",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileNames, addScreenshotToEditor } = args;
    try {
      await reportGateway.deleteFiles(reportId, fileNames);
    } catch {
      const state = getState();

      for (const fileName of fileNames) {
        const file = state.reportOverview.byIds?.[
          reportId
        ]?.contentScreenshots?.files?.find((f) => f.name === fileName);

        if (file?.signedUrl)
          addScreenshotToEditor({ fileUrl: file.signedUrl, fileName });
      }
    }
  },
);
