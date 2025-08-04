import { Editor } from '@tiptap/react';
import { reportHtmlIds } from '../../../dom/html-ids';

import { TextareaCard } from '../TextareaCard';
import { type InsertImages, type RedoImages } from '../TipTapEditor';
import { ReportVM } from '../../../../../VM/ReportVM';
import { useDeleteFilesReport } from '../../../../../mutations/reports/delete-files-report.mutation';
import {
  addTimestampToFiles,
  useInsertImagesWithSignedUrls
} from '../../../../../mutations/reports/screenshots/insert-images.mutation';
import { RealFileProvider } from '../../../../../utils/realFileProvider';
import { EMBEDDED_SCREENSHOTS_ACCEPTED_MIME_TYPES } from '../../../../../constants/mimetypes.constants';
import { DeterministicUuidGenerator } from '../../../../../utils/deterministicUuidGenerator';
import { TipTapEditorProvider } from '../../../../shared/TipTapEditorProvider';
import { useDeleteFileReport } from '../../../../../mutations/reports/delete-file-report.mutation';

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
  const { mutateAsync: insertImagesWithSignedUrlsAsync } =
    useInsertImagesWithSignedUrls();
  const { mutateAsync: deleteFilesAsync } = useDeleteFilesReport();
  const { mutateAsync: deleteFileAsync } = useDeleteFileReport();

  const insertImages: InsertImages = async (editor, files) => {
    const filesToUpload = await addTimestampToFiles(files, Date.now());
    await Promise.all(
      filesToUpload.map(
        new RealFileProvider().assertMimeTypeFactory(
          EMBEDDED_SCREENSHOTS_ACCEPTED_MIME_TYPES
        )
      )
    );

    const filesArg = filesToUpload.map((file) => ({
      file,
      fileId: new DeterministicUuidGenerator().genUuid()
    }));

    const images = await insertImagesWithSignedUrlsAsync({
      reportId,
      files: filesArg
    });

    const success = new TipTapEditorProvider(editor).setImages(images);

    if (!success) {
      await Promise.all(
        images.map(
          async (image: { file: File; signedUrl: string; fileId: string }) =>
            await deleteFileAsync({
              reportId,
              fileName: image.file.name
            })
        )
      );
      throw new Error(
        `Failed to embed the screenshot for report id ${reportId}`
      );
    }

    return images;
  };

  const deleteImages = async (
    editor: Editor,
    deletedImagesFileNames: string[]
  ) => {
    deleteFilesAsync({
      reportId,
      fileNames: deletedImagesFileNames
    }).catch((error) => {
      editor.chain().undo().run();
      throw error;
    });
  };

  const redoImages: RedoImages = async (editor: Editor, files: File[]) => {
    console.log('redoImages in progress', files, editor);
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
