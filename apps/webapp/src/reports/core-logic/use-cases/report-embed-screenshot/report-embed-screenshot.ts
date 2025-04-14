import { Editor } from "@tiptap/react";
import { ReportFileUsage } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { dataFileNameKey } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { deleteReportFile } from "../report-attached-file-deletion/delete-report-attached-file";
import { AppDispatch } from "../../../../store/reduxStore";

export type ReportEmbedScreenshotParams = {
  reportId: string;
  files: File[];
  editor: Editor;
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
      dispatch,
      extra: {
        gateways: { reportGateway },
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

    const filesWithUrl = await Promise.allSettled(
      filesArg.map(async ({ file, fileId }) => {
        const screenshotName = file.name;
        const signedUrl = await reportGateway.generateFileUrl(
          reportId,
          screenshotName,
        );

        return { file, signedUrl, fileId };
      }),
    );
    const fulfilledFiles = filesWithUrl.filter(
      (result) => result.status === "fulfilled",
    );
    const rejectedFiles = filesWithUrl.filter(
      (result) => result.status === "rejected",
    );

    if (rejectedFiles.length) {
      deleteFiles(fulfilledFiles, dispatch, reportId);
      rejectWithValue(
        `Failed to embed the screenshot for report id ${reportId} with reasons ${rejectedFiles.map((f) => f.reason).join("\n")}`,
      );
    }

    let chained = editor.chain().focus();

    for (const fullfiledFile of fulfilledFiles) {
      const {
        value: { file, signedUrl },
      } = fullfiledFile;

      chained = chained.setImage({
        // Cet attribut est ajouté lors de la customisation de l'extension Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dataFileNameKey as any]: file.name,
        src: signedUrl,
      });
    }

    const success = chained.run();

    if (!success) {
      deleteFiles(fulfilledFiles, dispatch, reportId);
    }

    return fulfilledFiles.map((f) => f.value);
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

function deleteFiles(
  fulfilledFiles: PromiseFulfilledResult<{ file: File; signedUrl: string }>[],
  dispatch: AppDispatch,
  reportId: string,
) {
  fulfilledFiles.forEach(({ value: { file } }) => {
    dispatch(
      deleteReportFile({
        reportId,
        fileName: file.name,
      }),
    );
  });
}
