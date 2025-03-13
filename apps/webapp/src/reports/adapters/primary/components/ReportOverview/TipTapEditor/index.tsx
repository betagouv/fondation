import { EditorProvider } from "@tiptap/react";
import { MenuBar } from "./MenuBar";
import { extensions } from "./extensions";
import { useOnDeletedImage } from "./useOnDeletedImage";

export const TipTapEditor = ({
  value,
  onChange,
  ariaLabelledby,
  reportId,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  ariaLabelledby: string;
  reportId: string;
}) => {
  const {
    onCreate: initializeImageDeletionTracking,
    onUpdate: onDeletedImageUpdate,
  } = useOnDeletedImage(reportId);

  return (
    <EditorProvider
      slotBefore={<MenuBar reportId={reportId} />}
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
      onUpdate={({ editor }) => {
        onChange(editor.getHTML());
        onDeletedImageUpdate(editor);
      }}
    />
  );
};
