import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { AppDependencies, AppDispatch } from "../../../../store/reduxStore";
import { Editor } from "@tiptap/react";

export type ReportEmbedScreenshotParams = {
  reportId: string;
  file: File;
  editor: Editor;
};

export const reportEmbedScreenshot = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: AppDependencies;
  fulfilledMeta: {
    editor: Editor;
  };
}>()<File, ReportEmbedScreenshotParams>(
  "report/embedScreenshot",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider, dateProvider },
      },
      fulfillWithValue,
    },
  ) => {
    const { reportId, file, editor } = args;

    const timestamp = dateProvider.currentTimestamp();
    const screenshotName = `${file.name}-${timestamp}`;

    const fileToUpload = new File([await file.arrayBuffer()], screenshotName, {
      type: file.type,
    });

    const fileBuffer = await fileProvider.bufferFromFile(fileToUpload);
    const mimeType = await fileProvider.mimeTypeFromBuffer(fileBuffer);

    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.embeddedScreenshots;

    if (!mimeType || !acceptedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType || ""}`);
    }

    await reportGateway.uploadFile(
      reportId,
      fileToUpload,
      ReportFileUsage.EMBEDDED_SCREENSHOT,
    );

    return fulfillWithValue(fileToUpload, { editor });
  },
);
