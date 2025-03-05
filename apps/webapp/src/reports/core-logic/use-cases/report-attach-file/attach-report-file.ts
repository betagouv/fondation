import { AppState } from "../../../../store/appState";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type AttachReportFileParams = {
  reportId: string;
  file: File;
  mode: "attached" | "embedded-screenshot";
};

export const attachReportFile = createAppAsyncThunk<
  void,
  AttachReportFileParams
>(
  "report/attachFile",
  async (
    { reportId, file, mode },
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
      mode,
    );

    if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType || ""}`);
    }

    return reportGateway.attachFile(reportId, file);
  },
);

const getAcceptedMimeType = (
  acceptedMimeTypes: AppState["reportOverview"]["acceptedMimeTypes"],
  mode: AttachReportFileParams["mode"],
) => {
  switch (mode) {
    case "attached":
      return acceptedMimeTypes.attachedFiles;
    case "embedded-screenshot":
      return acceptedMimeTypes.embeddedScreenshots;
    default: {
      const _exhaustiveCheck: never = mode;
      return _exhaustiveCheck;
    }
  }
};
