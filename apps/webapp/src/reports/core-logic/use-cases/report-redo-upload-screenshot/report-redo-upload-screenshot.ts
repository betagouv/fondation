import { ReportFileUsage } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { TextEditorProvider } from "../../../../shared-kernel/core-logic/providers/textEditor";

export type ReportEmbedScreenshotParams = {
  reportId: string;
  files: File[];
  editor: TextEditorProvider;
};

type FulfilledValue = {
  file: File;
  signedUrl: string;
  fileId: string;
};

export const reportRedoUploadScreenshot = createAppAsyncThunk<
  FulfilledValue[],
  ReportEmbedScreenshotParams
>(
  "report/redoUploadScreenshot",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway, fileGateway },
        providers: { fileProvider, uuidGenerator },
      },
    },
  ) => {
    const { reportId, files, editor } = args;

    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.embeddedScreenshots;
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
      ReportFileUsage.EMBEDDED_SCREENSHOT,
    );

    const fileVMs = await fileGateway.getSignedUrls(
      filesArg.map(({ fileId }) => fileId),
    );

    editor.replaceImageUrls(fileVMs);

    const images = fileVMs.map((f) => {
      const file = filesArg.find((file) => file.file.name === f.name);
      if (!file) {
        throw new Error(
          `File with name ${f.name} not found in the uploaded files`,
        );
      }

      return {
        file: file.file,
        signedUrl: f.signedUrl,
        fileId: file.fileId,
      };
    });

    return images;
  },
);
