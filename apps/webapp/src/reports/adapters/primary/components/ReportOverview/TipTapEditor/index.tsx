import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import { Color } from "@tiptap/extension-color";
import { Document } from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorProvider } from "@tiptap/react";
import { headingLevels } from "./constant";
import { MenuBar } from "./MenuBar";

const extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Heading.configure({
    levels: headingLevels,
  }),
  Highlight.extend({
    // Ordre important : le span doit être dans le mark
    // pour que la couleur soit visible
    priority: 1000,
  }).configure({ multicolor: false }),
  BulletList,
  ListItem,
  TextStyle,
  Color,
  OrderedList,
];

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
