import { FileHandler as TipTapFileHandler } from '@tiptap/extension-file-handler';

import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from './constant';
import { makeEditorFilesUploader, type FilesUploader } from './editor-file-uploader';

export function FileHandler(uploadFiles: FilesUploader, options: { withVideos: boolean }) {
  const editorUploader = makeEditorFilesUploader(uploadFiles);

  return TipTapFileHandler.configure({
    allowedMimeTypes: [...IMAGE_MIME_TYPES, ...(options.withVideos ? VIDEO_MIME_TYPES : [])],
    onDrop: (editor, files, pos) => {
      editorUploader({ editor, files, pos });
    },
    onPaste: (editor, files) => {
      editorUploader({ editor, files });
    },
  });
}
