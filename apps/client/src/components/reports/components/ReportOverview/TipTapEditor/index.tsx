import React from 'react';
import { Editor, EditorProvider } from '@tiptap/react';
import { MenuBar } from './MenuBar';
import { createExtensions } from './extensions';
import { useOnDeletedImage } from './useOnDeletedImage';
import { useOnRedoImage } from './useOnRedoImage';
import { TipTapEditorProvider } from '../../../../shared/TipTapEditorProvider';
import { useRefreshSignedUrls } from '../../../../../hooks/useRefreshSignedUrls.hook';

export type InsertImages = (editor: Editor, files: File[]) => void;
export type RedoImages = (editor: Editor, files: File[]) => Promise<void>;
export type DeleteImages = (editor: Editor, deletedImagesFileNames: string[]) => Promise<void>;

type TipTapEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  ariaLabelledby: string;
  insertImages: InsertImages;
  deleteImages: DeleteImages;
  redoImages: RedoImages;
  screenshotFileIds?: string[];
};

export const TipTapEditor = ({
  value,
  onChange,
  ariaLabelledby,
  insertImages,
  deleteImages,
  redoImages,
  screenshotFileIds = []
}: TipTapEditorProps) => {
  const { onCreate: initializeImageDeletionTracking, onUpdate: onDeletedImageUpdate } =
    useOnDeletedImage(deleteImages);
  const { onCreate: initializeImageRedoTracking, onUpdate: onRedoImageUpdate } = useOnRedoImage(redoImages);

  const extensions = createExtensions();
  const [editor, setEditor] = React.useState<Editor | null>(null);

  // Hook pour le refresh automatique des URLs signées
  useRefreshSignedUrls(editor, screenshotFileIds);

  return (
    <EditorProvider
      slotBefore={<MenuBar insertImages={insertImages} />}
      extensions={extensions}
      content={value}
      editable
      editorProps={{
        attributes: {
          'aria-labelledby': ariaLabelledby
        }
      }}
      onCreate={({ editor }) => {
        setEditor(editor);
        const provider = new TipTapEditorProvider(editor);
        provider.persistImages();
        initializeImageDeletionTracking(editor);
        initializeImageRedoTracking(editor);
      }}
      onUpdate={async ({ editor, transaction }) => {
        onChange(editor.getHTML());
        await onDeletedImageUpdate(editor);
        onRedoImageUpdate(editor, transaction);
      }}
    />
  );
};
