import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import { Color } from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import History from '@tiptap/extension-history';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import ImageResize from 'tiptap-extension-resize-image';
import { headingLevels } from './constant';

export const dataFileNameKey = 'data-file-name';
export const dataIsScreenshotKey = 'data-is-screenshot';
export const fileKey = 'file';

export const createExtensions = (opts?: {
  history: {
    newGroupDelay: number;
  };
}) => [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Heading.configure({
    levels: headingLevels
  }),
  Highlight.extend({
    // Ordre important : le span doit être dans le mark
    // pour que la couleur soit visible
    priority: 1000
  }).configure({ multicolor: false }),
  BulletList,
  ListItem,
  TextStyle,
  Color,
  OrderedList,
  History.configure({
    newGroupDelay: opts?.history.newGroupDelay ?? 500
  }),

  ImageResize.extend({
    addStorage() {
      return {
        files: {}
      };
    },
    addCommands() {
      return {
        setImage:
          (attributes) =>
          ({ editor, tr }) => {
            const { $from } = tr.selection;
            const pos = $from.pos;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { file, ...attrs } = attributes as any;
            // Lors de l'ajout de plusieurs images en même temps,
            // on suit les changements de positions.
            tr.insert(
              pos,
              this.type.createAndFill({
                ...attrs
              })!
            );

            editor.storage.image.files[attrs[dataFileNameKey]] = file;
            tr.setMeta('setImage', true);
            return true;
          }
      };
    },

    addAttributes() {
      return {
        src: {
          default: null
        },
        style: {
          default: null
        },
        [dataFileNameKey]: {
          default: null
        },
        [dataIsScreenshotKey]: {
          default: true
        },
        class: {
          default: 'editor-resizable-image'
        },
        [fileKey]: {
          default: null
        }
      };
    }
  })
];
