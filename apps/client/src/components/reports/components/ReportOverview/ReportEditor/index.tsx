import { Editor } from '@tiptap/react';
import { reportHtmlIds } from '../../../dom/html-ids';

import { TextareaCard } from '../TextareaCard';
import { type InsertImages, type RedoImages } from '../TipTapEditor';
import { ReportVM } from '../../../../../VM/ReportVM';

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({
  comment,
  onUpdate,
  reportId
}) => {
  console.log('reportId', reportId);
  const insertImages: InsertImages = (editor, files) => {
    console.log('insertImages', editor, files);
    // dispatch(
    //   reportEmbedScreenshot({
    //     files,
    //     reportId,
    //     editor: new TipTapEditorProvider(editor)
    //   })
    // );
  };

  const deleteImages = async () =>
    // editor: Editor,
    // deletedImagesFileNames: string[]
    {
      // deleteReportContentScreenshots({
      //   fileNames: deletedImagesFileNames,
      //   reportId,
      //   editor
      // })
    };

  const redoImages: RedoImages = async (editor: Editor, files: File[]) => {
    console.log('redoImages', editor, files);
    // reportRedoUploadScreenshot({
    //   files,
    //   reportId,
    //   editor: new TipTapEditorProvider(editor)
    // })
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
