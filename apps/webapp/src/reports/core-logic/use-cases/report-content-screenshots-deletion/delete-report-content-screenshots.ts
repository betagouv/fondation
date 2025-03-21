import { Editor } from "@tiptap/react";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type DeleteReportContentScreenshotsParams = {
  reportId: string;
  fileNames: string[];
  editor: Editor;
};

export const deleteReportContentScreenshots = createAppAsyncThunk<
  void,
  DeleteReportContentScreenshotsParams
>(
  "report/deleteReportContentScreenshots",
  async (
    args,
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const { reportId, fileNames, editor } = args;
    try {
      await reportGateway.deleteFiles(reportId, fileNames);
    } catch (error) {
      editor.chain().undo().run();
      throw error;
    }
  },
);
