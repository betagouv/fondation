import { Editor, EditorProvider } from "@tiptap/react";
import { MenuBar } from "./MenuBar";
import { createExtensions } from "./extensions";
import { useOnDeletedImage } from "./useOnDeletedImage";

export type InsertImages = (editor: Editor, files: File[]) => void;
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
};

export const TipTapEditor = ({
  value,
  onChange,
  ariaLabelledby,
  insertImages,
  deleteImages,
}: TipTapEditorProps) => {
  const {
    onCreate: initializeImageDeletionTracking,
    onUpdate: onDeletedImageUpdate,
  } = useOnDeletedImage(deleteImages);

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
        initializeImageDeletionTracking(editor);
      }}
      onUpdate={async ({ editor }) => {
        onChange(editor.getHTML());
        await onDeletedImageUpdate(editor);
      }}
    />
  );
};
