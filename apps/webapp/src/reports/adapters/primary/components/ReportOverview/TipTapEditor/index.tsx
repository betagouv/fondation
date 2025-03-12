import { EditorProvider } from "@tiptap/react";
import { MenuBar } from "./MenuBar";
import { extensions } from "./extensions";

export const TipTapEditor = ({
  value,
  onChange,
  ariaLabelledby,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  ariaLabelledby: string;
}) => (
  <EditorProvider
    slotBefore={<MenuBar />}
    extensions={extensions}
    content={value}
    editable
    editorProps={{
      attributes: {
        "aria-labelledby": ariaLabelledby,
      },
    }}
    onUpdate={(content) => {
      onChange(content.editor.getHTML());
    }}
  />
);
