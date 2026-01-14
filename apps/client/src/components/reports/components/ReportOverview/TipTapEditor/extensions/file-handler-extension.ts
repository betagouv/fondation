import { FileHandler as TipTapFileHandler } from '@tiptap/extension-file-handler';
import { makeEditorImageUploader, type FilesUploader } from './editor-file-uploader';

export function FileHandler(uploadFiles: FilesUploader) {
  const editorUploader = makeEditorImageUploader(uploadFiles);

  return TipTapFileHandler.configure({
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'],
    onPaste: (editor, files) => {
      editorUploader({ editor, files });
    },
    onDrop: (editor, files, pos) => {
      editorUploader({ editor, files, pos });
    }
  });
}
