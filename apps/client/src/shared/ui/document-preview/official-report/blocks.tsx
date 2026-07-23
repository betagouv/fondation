import type { AnyExtension } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';

import {
  OfficialReportConclusionBlock,
  OfficialReportConclusionBlockNode,
} from './blocks/OfficialReportConclusionBlock';
import {
  OfficialReportFileBlock,
  OfficialReportFileBlockNode,
  OfficialReportFileListNode,
} from './blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock, OfficialReportIntroBlockNode } from './blocks/OfficialReportIntroBlock';
import {
  OfficialReportSectionIntroBlock,
  OfficialReportSectionIntroBlockNode,
} from './blocks/OfficialReportSectionIntroBlock';
import {
  OfficialReportSectionTitleBlock,
  OfficialReportSectionTitleBlockNode,
} from './blocks/OfficialReportSectionTitleBlock';
import { type BlockDescriptor, type OfficialReportBlockCallbacks } from './utils';

/**
 * Undo/redo restore the block content *and* its `outdated` attribute (tracked by
 * prosemirror-history). `onHistory` lets the model re-persist the restored state so the
 * backend `outdated` flag follows the editor.
 */
const OfficialReportUndoRedo = UndoRedo.extend<{ onHistory: (() => void) | null }>({
  addOptions() {
    return { ...this.parent?.(), onHistory: null };
  },
  addCommands() {
    const parent = this.parent?.();
    type CommandFn = () => (props: { dispatch?: unknown }) => boolean;
    const wrap =
      (command: CommandFn | undefined): CommandFn =>
      () =>
      (props) => {
        const ran = command?.()(props) ?? false;
        if (ran && props.dispatch) this.options.onHistory?.();
        return ran;
      };
    return {
      ...parent,
      undo: wrap(parent?.undo as CommandFn | undefined),
      redo: wrap(parent?.redo as CommandFn | undefined),
    };
  },
});

const OFFICIAL_REPORT_BLOCKS = [
  OfficialReportIntroBlock,
  OfficialReportSectionTitleBlock,
  OfficialReportSectionIntroBlock,
  OfficialReportFileBlock,
  OfficialReportConclusionBlock,
] as const satisfies BlockDescriptor[];

export const officialReportBlocks = new Map<string, BlockDescriptor>(
  OFFICIAL_REPORT_BLOCKS.map((descriptor) => [descriptor.name, descriptor]),
);

export function descriptorByNodeName(name: string): BlockDescriptor | undefined {
  return officialReportBlocks.get(name);
}

export function buildOfficialReportExtensions(callbacks: OfficialReportBlockCallbacks): AnyExtension[] {
  return [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    BulletList,
    ListItem,
    OrderedList,
    OfficialReportUndoRedo.configure({ onHistory: callbacks.onHistory }),
    OfficialReportIntroBlockNode.configure({ callbacks }),
    OfficialReportConclusionBlockNode.configure({ callbacks }),
    OfficialReportSectionTitleBlockNode.configure({ callbacks }),
    OfficialReportFileBlockNode.configure({ callbacks }),
    OfficialReportFileListNode,
    OfficialReportSectionIntroBlockNode.configure({ callbacks }),
  ];
}
