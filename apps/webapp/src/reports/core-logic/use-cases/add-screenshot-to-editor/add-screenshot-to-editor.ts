import { Editor } from "@tiptap/react";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { dataFileNameKey } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { deleteReportFile } from "../report-attached-file-deletion/delete-report-attached-file";

export type AddScreenshotToEditorParams = {
  reportId: string;
  fileName: string;
  fileUrl: string;
  editor: Editor;
};

export const addScreenshotToEditor = createAppAsyncThunk<
  { success: boolean },
  AddScreenshotToEditorParams
>(
  "report/addScreenshotToEditor",
  async ({ reportId, fileName, fileUrl, editor }, { dispatch }) => {
    const success = editor
      .chain()
      .focus()
      .setImage({
        // Cet attribut est ajouté lors de la customisation de l'extension Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dataFileNameKey as any]: fileName,
        src: fileUrl,
      })
      .run();

    if (!success) {
      await dispatch(
        deleteReportFile({
          reportId,
          fileName,
        }),
      );
    }

    return { success };
  },
);
