import { ReportFileUsage } from "shared-models";
import { TextEditorProvider } from "../../../../shared-kernel/core-logic/providers/textEditor";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

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

export const reportEmbedScreenshot = createAppAsyncThunk<
  FulfilledValue[],
  ReportEmbedScreenshotParams
>(
  "report/embedScreenshot",
  async (
    args,
    {
      getState,
      extra: {
        gateways: { reportGateway, fileGateway },
        providers: { fileProvider, dateProvider, uuidGenerator },
      },
      rejectWithValue,
    },
  ) => {
    const { reportId, files, editor } = args;

    const timestamp = dateProvider.currentTimestamp();

    const filesToUpload = await addTimestampToFiles(files, timestamp);

    const acceptedMimeTypes =
      getState().reportOverview.acceptedMimeTypes.embeddedScreenshots;
    await Promise.all(
      filesToUpload.map(fileProvider.assertMimeTypeFactory(acceptedMimeTypes)),
    );

    const filesArg = filesToUpload.map((file) => ({
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
    const success = editor.setImages(images);
    if (!success) {
      await Promise.all(
        images.map((image) =>
          reportGateway.deleteFile(reportId, image.file.name),
        ),
      );
      throw rejectWithValue(
        `Failed to embed the screenshot for report id ${reportId}`,
      );
    }

    return images;
  },
);

async function addTimestampToFiles(files: File[], timestamp: number) {
  return await Promise.all(
    files.map(async (file) => {
      const screenshotName = `${file.name}-${timestamp}`;

      return new File([await file.arrayBuffer()], screenshotName, {
        type: file.type,
      });
    }),
  );
}
