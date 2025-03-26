import { Editor } from "@tiptap/react";
import { deleteReportContentScreenshots } from "../../../../../core-logic/use-cases/report-content-screenshots-deletion/delete-report-content-screenshots";
import { reportEmbedScreenshot } from "../../../../../core-logic/use-cases/report-embed-screenshot/report-embed-screenshot";
import { ReportVM } from "../../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../../dom/html-ids";
import { useAppDispatch } from "../../../hooks/react-redux";
import { TextareaCard } from "../TextareaCard";
import { InsertImages } from "../TipTapEditor";

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
        editor,
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

  return (
    <TextareaCard
      cardId={reportHtmlIds.overview.commentSection}
      titleId={reportHtmlIds.overview.comment}
      label={ReportVM.commentLabel}
      content={comment}
      onContentChange={onUpdate}
      insertImages={insertImages}
      deleteImages={deleteImages}
    />
  );
};
