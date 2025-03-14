import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import { Color } from "@tiptap/extension-color";
import { Document } from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import History from "@tiptap/extension-history";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { headingLevels } from "./constant";

export const dataFileNameKey = "data-file-name";

export const extensions = [
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
  History,
  Image.configure({
    HTMLAttributes: {
      width: "100%",
    },
  }).extend({
    addAttributes() {
      return {
        src: {
          default: null,
        },
        [dataFileNameKey]: {
          default: null,
        },
      };
    },
  }),
];
