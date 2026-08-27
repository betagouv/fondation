import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import type { ReactNodeViewProps } from '@tiptap/react';

import { tipTapNodeToHtml } from '@/features/documents/components/blocks/tiptap-node-to-html';
import * as $api from '@api/sdk';

import { type AgendaBlock } from './agenda-blocks.type';
import { AgendaFileBlock } from './AgendaFileBlock';

export class AgendaBlocksModel {
  readonly blocks: readonly AgendaBlock[];
  readonly agendaId: string;

  private readonly persistor: AgendaEditionBlockPersistor;
  private state: Map<BlockKey, AgendaEditionBlock> | undefined;

  constructor(props: { agendaId: string; blocks: readonly AgendaBlock[] }) {
    this.blocks = props.blocks;
    this.agendaId = props.agendaId;

    this.persistor = new AgendaEditionBlockPersistor(this.agendaId);
  }

  /**
   * tiptap changes the provided html... In order to compare the user provided HTML
   * with the server one, we need to use the `Editor` as source of truth.
   */
  withEditor(editor: Editor): void {
    const state = new Map<BlockKey, AgendaEditionBlock>();

    editor.state.doc.descendants((node) => {
      if (node.type.name !== AgendaFileBlock.name) return true;

      const block = AgendaEditionBlock.from(editor, node);
      if (block) {
        state.set(block.key, block);
      }

      return false;
    });

    this.state = state;
  }

  /** synchronizes text edition with the backend  */
  async onEditorUpdate(editor: Editor): Promise<void> {
    if (!this.state) return;

    const diff = AgendaEditorDiff.from(this.state, editor);
    for (const block of diff) {
      await this.persistor.persist(block);
      this.state.set(block.key, block);
    }
  }

  /**
   * removes the user edition in favor of the system generated text,
   * and unsets the `outdated` flag
   */
  async resetBlock(props: ReactNodeViewProps): Promise<void> {
    const { node, editor } = props;

    const block = AgendaEditionBlock.from(editor, node);
    if (!block) return;

    props.updateAttributes({ isPending: true });
    try {
      await this.persistor.reset(block);

      const pos = props.getPos();
      if (pos == null) return;

      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeAttribute(pos, 'outdated', false).setNodeAttribute(pos, 'generatedHtml', null);
          return true;
        })
        .insertContentAt({ from: pos + 1, to: pos + node.nodeSize - 1 }, node.attrs.generatedHtml)
        .run();

      const nextNode = editor.state.doc.nodeAt(pos);
      if (!nextNode) return;

      const nextBlock = AgendaEditionBlock.from(editor, nextNode);
      if (!nextBlock) return;

      this.state?.set(nextBlock.key, nextBlock);
    } finally {
      props.updateAttributes({ isPending: false });
    }
  }

  /** unset the outdated flag, but keeps the users edition */
  async acknowledgeBlock(props: ReactNodeViewProps): Promise<void> {
    const { editor, node } = props;

    const generatedHtml = node.attrs.generatedHtml;

    props.updateAttributes({ isPending: true });

    try {
      props.updateAttributes({ outdated: false });

      const pos = props.getPos();
      if (pos == null) return;

      const nextNode = editor.state.doc.nodeAt(pos);
      if (!nextNode) return;

      const block = AgendaEditionBlock.from(editor, node);
      if (!block) return;

      await this.persistor.persist(block);
      this.state?.set(block.key, block);
    } catch {
      props.updateAttributes({ generatedHtml, outdated: true });
    } finally {
      props.updateAttributes({ isPending: false });
    }
  }
}

type BlockKey = `file:${string}`;

export type AgendaEditionBlockState = {
  kind: 'file';
  key: BlockKey;
  fileId: string;
  html: string;
  outdated: boolean;
};

export class AgendaEditionBlock {
  get key(): BlockKey {
    return this.block.key;
  }

  constructor(readonly block: AgendaEditionBlockState) {}

  static from(editor: Editor, node: PMNode): AgendaEditionBlock | null {
    const block = this.state(editor, node);
    return block ? new AgendaEditionBlock(block) : null;
  }

  equals(other: AgendaEditionBlock): boolean {
    return (
      this.block.key === other.block.key &&
      this.block.html === other.block.html &&
      this.block.outdated === other.block.outdated
    );
  }

  private static state(editor: Editor, node: PMNode): AgendaEditionBlockState | null {
    if (node.type.name !== AgendaFileBlock.name) return null;

    const fileId = node.attrs.fileId as string;
    return {
      kind: 'file',
      key: `file:${fileId}`,
      fileId,
      html: tipTapNodeToHtml(node, editor.schema),
      outdated: node.attrs.outdated as boolean,
    };
  }
}

class AgendaEditorDiff implements Iterable<AgendaEditionBlock> {
  private constructor(private readonly blocks: AgendaEditionBlock[]) {}

  *[Symbol.iterator]() {
    return yield* this.blocks;
  }

  static from(state: Map<BlockKey, AgendaEditionBlock>, editor: Editor): AgendaEditorDiff {
    const changedBlocks: AgendaEditionBlock[] = [];

    editor.state.doc.descendants((node) => {
      if (node.type.name !== AgendaFileBlock.name) return true;

      const nextBlock = AgendaEditionBlock.from(editor, node);
      if (!nextBlock) return false;

      const prevBlock = state.get(nextBlock.key);
      if (!prevBlock) return false;

      if (!prevBlock.equals(nextBlock)) {
        changedBlocks.push(nextBlock);
      }

      return false;
    });

    return new AgendaEditorDiff(changedBlocks);
  }
}

export class AgendaEditionBlockPersistor {
  constructor(private readonly agendaId: string) {}

  reset({ block }: AgendaEditionBlock): Promise<unknown> {
    return $api.docs.resetAgendaFileBlock({
      path: { agendaId: this.agendaId, fileId: block.fileId },
    });
  }

  persist({ block }: AgendaEditionBlock): Promise<unknown> {
    return $api.docs.editAgendaFileBlock({
      path: { agendaId: this.agendaId, fileId: block.fileId },
      body: { html: block.html, outdated: block.outdated },
    });
  }
}
