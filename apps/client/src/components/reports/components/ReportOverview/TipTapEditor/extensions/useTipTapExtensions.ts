import type { AnyExtension } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Dropcursor, UndoRedo } from '@tiptap/extensions';
import React from 'react';

import { headingLevels } from './constant';
import type { FilesUploader } from './editor-file-uploader';
import { FileHandler } from './file-handler-extension';
import { ImageUploadPreview } from './ImageUploadPreview';

export function useTipTapExtensions(opts?: {
  uploadFiles?: FilesUploader;
  history?: { newGroupDelay: number };
}) {
  const extensions = React.useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({
        levels: [...headingLevels]
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
      UndoRedo.configure({
        newGroupDelay: opts?.history?.newGroupDelay ?? 300
      }),
      Dropcursor,
      Image.configure({
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true
        }
      }),
      ...(opts?.uploadFiles ? [ImageUploadPreview(opts.uploadFiles), FileHandler(opts.uploadFiles)] : [])
    ],
    [opts?.uploadFiles, opts?.history?.newGroupDelay]
  );

  return extensions as AnyExtension[];
}
