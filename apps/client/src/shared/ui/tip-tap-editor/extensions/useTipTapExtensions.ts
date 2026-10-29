import type { AnyExtension } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { TableKit } from '@tiptap/extension-table';
import Text from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { UniqueID } from '@tiptap/extension-unique-id';
import { Dropcursor, UndoRedo } from '@tiptap/extensions';
import React from 'react';

import { Callout } from './callout-extension';
import {
  dataFileIdKey,
  dataFileNameKey,
  type EditorFeatures,
  headingLevels,
  isAllowedLink,
  isSectionAnchor,
} from './constant';
import type { FilesUploader } from './editor-file-uploader';
import { FileHandler } from './file-handler-extension';
import { ImageUploadPreview } from './ImageUploadPreview';
import { Video } from './video-extension';

export function useTipTapExtensions(opts?: {
  features?: EditorFeatures;
  uploadFiles?: FilesUploader;
  history?: { newGroupDelay: number };
}) {
  const isPage = opts?.features === 'page';
  const extensions = React.useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({
        levels: [...headingLevels],
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
      UndoRedo.configure({
        newGroupDelay: opts?.history?.newGroupDelay ?? 300,
      }),
      Dropcursor,
      Image.extend({
        addAttributes: () => ({
          src: null,
          alt: null,
          title: null,
          width: null,
          height: null,
          [dataFileIdKey]: null,
          [dataFileNameKey]: null,
        }),
      }).configure({
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
        },
      }),
      ...(opts?.uploadFiles
        ? [ImageUploadPreview(opts.uploadFiles), FileHandler(opts.uploadFiles, { withVideos: isPage })]
        : []),
      ...(isPage
        ? [
            // a title keeps its identity through its renames, so a link to a section survives them
            UniqueID.configure({ types: ['heading'] }),
            Link.configure({
              HTMLAttributes: { rel: null, target: null },
              isAllowedUri: (url, ctx) =>
                isAllowedLink(url) && (isSectionAnchor(url) || ctx.defaultValidate(url)),
              openOnClick: false,
            }),
            HorizontalRule,
            Callout,
            TableKit.configure({ table: { resizable: false } }),
            Video,
          ]
        : []),
    ],
    [isPage, opts?.uploadFiles, opts?.history?.newGroupDelay],
  );

  return extensions as AnyExtension[];
}
