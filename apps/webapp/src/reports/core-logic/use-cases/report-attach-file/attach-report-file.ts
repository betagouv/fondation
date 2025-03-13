import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { AppDependencies, AppDispatch } from "../../../../store/reduxStore";

type CommonParams = {
  reportId: string;
  file: File;
};

export type AttachReportFileParams =
  | (CommonParams & {
      usage: ReportFileUsage.ATTACHMENT;
    })
  | (CommonParams & {
      usage: ReportFileUsage.EMBEDDED_SCREENSHOT;
      addScreenshotToEditor: (fileUrl: string) => boolean;
    });

export const attachReportFile = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: AppDependencies;
  fulfilledMeta: {
    addScreenshotToEditor?: (fileUrl: string) => boolean;
  };
}>()<void, AttachReportFileParams>(
  "report/attachFile",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider },
      },
      fulfillWithValue,
    },
  ) => {
    const { reportId, file, usage } = args;
    const fileBuffer = await fileProvider.bufferFromFile(file);

    const mimeType = await fileProvider.mimeTypeFromBuffer(fileBuffer);

    const acceptedMimeTypes = getAcceptedMimeType(
      getState().reportOverview.acceptedMimeTypes,
      usage,
    );

    if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType || ""}`);
    }

    await reportGateway.attachFile(reportId, file, usage);
    return fulfillWithValue(
      void 0,
      usage === ReportFileUsage.EMBEDDED_SCREENSHOT
        ? { addScreenshotToEditor: args.addScreenshotToEditor }
        : {},
    );
  },
);

const getAcceptedMimeType = (
  acceptedMimeTypes: AppState["reportOverview"]["acceptedMimeTypes"],
  usage: ReportFileUsage,
) => {
  switch (usage) {
    case ReportFileUsage.ATTACHMENT:
      return acceptedMimeTypes.attachedFiles;
    case ReportFileUsage.EMBEDDED_SCREENSHOT:
      return acceptedMimeTypes.embeddedScreenshots;
    default: {
      const _exhaustiveCheck: never = usage;
      return _exhaustiveCheck;
    }
  }
};
