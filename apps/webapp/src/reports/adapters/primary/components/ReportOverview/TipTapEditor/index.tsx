import { Editor, EditorProvider } from "@tiptap/react";
import { MenuBar } from "./MenuBar";
import { createExtensions } from "./extensions";
import { useOnDeletedImage } from "./useOnDeletedImage";
import { useOnRedoImage } from "./useOnRedoImage";
import { TipTapEditorProvider } from "../../../../../../shared-kernel/adapters/primary/react/TipTapEditorProvider";

export type InsertImages = (editor: Editor, files: File[]) => void;
export type RedoImages = (editor: Editor, files: File[]) => Promise<void>;
export type DeleteImages = (
  editor: Editor,
  deletedImagesFileNames: string[],
) => Promise<void>;

type TipTapEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  ariaLabelledby: string;
  insertImages: InsertImages;
  deleteImages: DeleteImages;
  redoImages: RedoImages;
};

export const TipTapEditor = ({
  value,
  onChange,
  ariaLabelledby,
  insertImages,
  deleteImages,
  redoImages,
}: TipTapEditorProps) => {
  const {
    onCreate: initializeImageDeletionTracking,
    onUpdate: onDeletedImageUpdate,
  } = useOnDeletedImage(deleteImages);
  const { onCreate: initializeImageRedoTracking, onUpdate: onRedoImageUpdate } =
    useOnRedoImage(redoImages);

  const extensions = createExtensions();

  return (
    <EditorProvider
      slotBefore={<MenuBar insertImages={insertImages} />}
      extensions={extensions}
      content={value}
      editable
      editorProps={{
        attributes: {
          "aria-labelledby": ariaLabelledby,
        },
      }}
      onCreate={({ editor }) => {
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
