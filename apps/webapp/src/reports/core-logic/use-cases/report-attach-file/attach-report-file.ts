import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type AttachReportFileParams = {
  reportId: string;
  file: File;
  usage: ReportFileUsage;
};

export const attachReportFile = createAppAsyncThunk<
  void,
  AttachReportFileParams
>(
  "report/attachFile",
  async (
    { reportId, file, usage },
    {
      getState,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider },
      },
    },
  ) => {
    const fileBuffer = await fileProvider.bufferFromBrowserFile(file);
    const mimeType = await fileProvider.mimeTypeFromBuffer(fileBuffer);

    const acceptedMimeTypes = getAcceptedMimeType(
      getState().reportOverview.acceptedMimeTypes,
      usage,
    );

    if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType || ""}`);
    }

    return reportGateway.attachFile(reportId, file, usage);
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
