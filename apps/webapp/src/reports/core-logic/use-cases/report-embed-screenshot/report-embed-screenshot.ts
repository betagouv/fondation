import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { AppDependencies, AppDispatch } from "../../../../store/reduxStore";
import { Editor } from "@tiptap/react";
import { dataFileNameKey } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { deleteReportFile } from "../report-attached-file-deletion/delete-report-attached-file";

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
}>()<{ file: File; signedUrl: string }, ReportEmbedScreenshotParams>(
  "report/embedScreenshot",
  async (
    args,
    {
      getState,
      dispatch,
      extra: {
        gateways: { reportGateway },
        providers: { fileProvider, dateProvider },
      },
      fulfillWithValue,
      rejectWithValue,
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

    const signedUrl = await reportGateway.generateFileUrl(
      reportId,
      screenshotName,
    );

    const success = editor
      .chain()
      .focus()
      .setMeta("isUpload", true)
      .setImage({
        // Cet attribut est ajouté lors de la customisation de l'extension Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dataFileNameKey as any]: screenshotName,
        src: signedUrl,
      })
      .run();

    if (!success) {
      await dispatch(
        deleteReportFile({
          reportId,
          fileName: screenshotName,
        }),
      );
      rejectWithValue(
        `Failed to embed the screenshot for report id ${reportId} nad file name ${screenshotName}`,
      );
    }

    return fulfillWithValue({ file: fileToUpload, signedUrl }, { editor });
  },
);
