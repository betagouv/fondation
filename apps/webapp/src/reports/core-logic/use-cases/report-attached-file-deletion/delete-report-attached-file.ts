import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { AppDependencies, AppDispatch } from "../../../../store/reduxStore";

type CommonParams = {
  reportId: string;
  fileName: string;
};

export type DeleteReportAttachedFileParams =
  | (CommonParams & {
      usage: ReportFileUsage.ATTACHMENT;
    })
  | (CommonParams & {
      usage: ReportFileUsage.EMBEDDED_SCREENSHOT;
      addScreenshotToEditor?: (fileUrl: string) => boolean;
    });

export const deleteReportAttachedFile = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: AppDependencies;
  rejectedMeta: {
    addScreenshotToEditor?: (fileUrl: string) => boolean;
  };
}>()<void, DeleteReportAttachedFileParams>(
  "report/deleteReportAttachedFile",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileName } = args;
    try {
      await reportGateway.deleteAttachedFile(reportId, fileName);
    } catch {
      if (
        args.usage === ReportFileUsage.EMBEDDED_SCREENSHOT &&
        args.addScreenshotToEditor
      ) {
        const state = getState();
        const file = state.reportOverview.byIds?.[
          reportId
        ]?.attachedFiles?.find((f) => f.name === fileName);
        if (file?.signedUrl) args.addScreenshotToEditor(file.signedUrl);
      }
    }
  },
);
