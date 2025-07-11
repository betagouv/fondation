import { Editor } from '@tiptap/react';
import { reportHtmlIds } from '../../../dom/html-ids';

import { TextareaCard } from '../TextareaCard';
import { type InsertImages, type RedoImages } from '../TipTapEditor';
import { ReportVM } from '../../../../../VM/ReportVM';
import { useDeleteFilesReport } from '../../../../../mutations/reports/delete-files-report.mutation';
import {
  addTimestampToFiles,
  useInsertImages
} from '../../../../../mutations/reports/screenshots/insert-images.mutation';
import { RealFileProvider } from '../../../../../utils/realFileProvider';
import { EMBEDDED_SCREENSHOTS_ACCEPTED_MIME_TYPES } from '../../../../../constants/mimetypes.constants';
import { DeterministicUuidGenerator } from '../../../../../utils/deterministicUuidGenerator';
import { useGetSignedUrl } from '../../../../queries/get-signed-url.query';
import { TipTapEditorProvider } from '../../../../shared/TipTapEditorProvider';
import { useDeleteFileReport } from '../../../../../mutations/reports/delete-file.mutation';
import { useState } from 'react';

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

// TODO AEB CORRECT THIS REPORT EDITOR
export const ReportEditor: React.FC<ReportEditorProps> = ({
  comment,
  onUpdate,
  reportId
}) => {
  console.log('reportId', reportId);

  const [fileIds, setFileIds] = useState<string[]>([]);
  const { refetch: refetchSignedUrls } = useGetSignedUrl(fileIds);
  const { mutateAsync: insertImagesAsync } = useInsertImages();
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

    await insertImagesAsync({
      reportId,
      files: filesArg
    });

    const newFileIds = filesArg.map((f) => f.fileId);
    setFileIds(newFileIds);

    const { data: newSignedUrls } = await refetchSignedUrls();
    const images = newSignedUrls?.map((f) => {
      const file = filesArg.find((file) => file.file.name === f.name);
      if (!file) {
        throw new Error(
          `File with name ${f.name} not found in the uploaded files`
        );
      }

      return {
        file: file.file,
        signedUrl: f.signedUrl,
        fileId: file.fileId
      };
    });
    const success = new TipTapEditorProvider(editor).setImages(images ?? []);

    if (!success) {
      await Promise.all(
        (images || []).map(
          async (image) =>
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
    console.log('redoImages in progress', files);
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
