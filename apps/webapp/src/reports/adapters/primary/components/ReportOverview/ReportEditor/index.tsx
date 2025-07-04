import { Editor } from "@tiptap/react";
import { TipTapEditorProvider } from "../../../../../../shared-kernel/adapters/primary/react/TipTapEditorProvider";
import { deleteReportContentScreenshots } from "../../../../../core-logic/use-cases/report-content-screenshots-deletion/delete-report-content-screenshots";
import { reportEmbedScreenshot } from "../../../../../core-logic/use-cases/report-embed-screenshot/report-embed-screenshot";
import { reportRedoUploadScreenshot } from "../../../../../core-logic/use-cases/report-redo-upload-screenshot/report-redo-upload-screenshot";
import { ReportVM } from "../../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../../dom/html-ids";
import { useAppDispatch } from "../../../hooks/react-redux";
import { TextareaCard } from "../TextareaCard";
import { InsertImages, RedoImages } from "../TipTapEditor";

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({
  comment,
  onUpdate,
  reportId,
}) => {
  const dispatch = useAppDispatch();

  const insertImages: InsertImages = (editor, files) => {
    dispatch(
      reportEmbedScreenshot({
        files,
        reportId,
        editor: new TipTapEditorProvider(editor),
      }),
    );
  };

  const deleteImages = async (
    editor: Editor,
    deletedImagesFileNames: string[],
  ) => {
    await dispatch(
      deleteReportContentScreenshots({
        fileNames: deletedImagesFileNames,
        reportId,
        editor,
      }),
    );
  };

  const redoImages: RedoImages = async (editor: Editor, files: File[]) => {
    await dispatch(
      reportRedoUploadScreenshot({
        files,
        reportId,
        editor: new TipTapEditorProvider(editor),
      }),
    );
  };

  return (
    <TextareaCard
      cardId={reportHtmlIds.overview.commentSection}
      titleId={reportHtmlIds.overview.comment}
      label={ReportVM.commentLabel}
      content={comment}
      onContentChange={onUpdate}
      insertImages={insertImages}
      deleteImages={deleteImages}
      redoImages={redoImages}
    />
  );
};
