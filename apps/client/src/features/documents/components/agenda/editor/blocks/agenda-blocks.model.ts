import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import type { ReactNodeViewProps } from '@tiptap/react';

import { plainText, readsTheSame } from '@/features/documents/components/blocks/proposed-text';
import { tipTapNodeToHtml } from '@/features/documents/components/blocks/tiptap-node-to-html';
import * as $api from '@api/sdk';

import { type AgendaBlock } from './agenda-blocks.type';
import { AgendaFileBlock } from './AgendaFileBlock';

type PendingChange =
  | { block: AgendaEditionBlock; kind: 'edit' }
  | { block: AgendaEditionBlock; kind: 'reset' };

export class AgendaEmptied extends Error {}

export class AgendaBlocksModel {
  readonly agendaId: string;
  readonly blocks: readonly AgendaBlock[];

  private readonly onDirtyChange: (isDirty: boolean) => void;
  private readonly pending = new Map<BlockKey, PendingChange>();
  private readonly persistor: AgendaEditionBlockPersistor;
  private remaining: Set<string>;
  private state: Map<BlockKey, AgendaEditionBlock> | undefined;

  constructor(props: {
    agendaId: string;
    blocks: readonly AgendaBlock[];
    onDirtyChange?: (isDirty: boolean) => void;
  }) {
    this.blocks = props.blocks;
    this.agendaId = props.agendaId;
    this.onDirtyChange = props.onDirtyChange ?? (() => {});

    this.remaining = new Set(props.blocks.map((block) => String(block.id)));
    this.persistor = new AgendaEditionBlockPersistor(this.agendaId);
  }

  get isDirty(): boolean {
    return this.pending.size > 0 || this.removedNominationFileIds.length > 0;
  }

  get isEmptied(): boolean {
    return this.removedNominationFileIds.length > 0 && this.keptNominationFileIds.length === 0;
  }

  private stage(key: BlockKey, change: PendingChange | null): void {
    if (change) {
      this.pending.set(key, change);
    } else {
      this.pending.delete(key);
    }

    this.onDirtyChange(this.isDirty);
  }

  /**
   * sends every staged edition to the server, in the order the reader made them.
   * @warning the caller flushes the pending staging first: recomputing it here would duplicate
   * the comparison and could unstage the very edition being saved.
   */
  async save(): Promise<{ hasRemovedPropositions: boolean }> {
    // emptying the last block would leave a document with nothing to say, which deleting the
    // agenda does far better, and deleting it carries the official report away too
    if (this.isEmptied) throw new AgendaEmptied();

    const hasRemovedPropositions = this.removedNominationFileIds.length > 0;

    // the propositions leave first: the texts that follow must not be written on dropped blocks
    if (hasRemovedPropositions) {
      await this.persistor.keepOnly(this.keptNominationFileIds);
    }

    for (const [key, change] of this.pending) {
      if (change.kind === 'reset') {
        await this.persistor.reset(change.block);
      } else {
        await this.persistor.persist(change.block);
      }

      this.state?.set(key, change.block);
    }

    this.pending.clear();
    this.remaining = new Set(this.blocks.map((block) => String(block.id)));
    this.onDirtyChange(false);

    return { hasRemovedPropositions };
  }

  discard(): void {
    this.pending.clear();
    this.remaining = new Set(this.blocks.map((block) => String(block.id)));
    this.onDirtyChange(false);
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

  get removedNominationFileIds(): string[] {
    const kept = new Set(this.remaining);

    return this.blocks.flatMap((block) =>
      block.nominationFileId && !kept.has(String(block.id)) ? [block.nominationFileId] : [],
    );
  }

  get keptNominationFileIds(): string[] {
    const kept = new Set(this.remaining);

    return this.blocks.flatMap((block) =>
      block.nominationFileId && kept.has(String(block.id)) ? [block.nominationFileId] : [],
    );
  }

  onEditorUpdate(editor: Editor): void {
    if (!this.state) return;

    const changed = new Set(Array.from(AgendaEditorDiff.from(this.state, editor), ({ key }) => key));
    const present = AgendaEditorDiff.blocksOf(editor);

    // a block torn out of the document, or left blank, means its proposition leaves the agenda:
    // whoever meant to keep it would have written something in it
    const kept = present.filter(({ block }) => plainText(block.html).trim());
    this.remaining = new Set(kept.map(({ block }) => block.fileId));
    this.onDirtyChange(this.isDirty);

    for (const block of kept) {
      const { edited, generatedHtml, html } = block.block;

      // a stored edition typed back to the text the document proposes is no longer an edition of
      // it. An untouched block always matches that text, and has nothing to undo.
      if (edited && generatedHtml && readsTheSame(html, generatedHtml)) {
        this.stage(block.key, { block, kind: 'reset' });
      } else if (changed.has(block.key)) {
        this.stage(block.key, { block, kind: 'edit' });
      } else if (this.pending.has(block.key)) {
        this.stage(block.key, null);
      }
    }
  }

  async resetBlock(props: ReactNodeViewProps): Promise<void> {
    const { editor, node } = props;

    const block = AgendaEditionBlock.from(editor, node);
    if (!block) return;

    props.updateAttributes({ isPending: true });
    try {
      const pos = props.getPos();
      if (pos == null) return;

      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeAttribute(pos, 'outdated', false);
          return true;
        })
        .insertContentAt({ from: pos + 1, to: pos + node.nodeSize - 1 }, node.attrs.generatedHtml)
        .run();

      const nextNode = editor.state.doc.nodeAt(pos);
      if (!nextNode) return;

      const nextBlock = AgendaEditionBlock.from(editor, nextNode);
      if (!nextBlock) return;

      this.stage(nextBlock.key, { block: nextBlock, kind: 'reset' });
    } finally {
      props.updateAttributes({ isPending: false });
    }
  }

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

      const block = AgendaEditionBlock.from(editor, nextNode);
      if (!block) return;

      this.stage(block.key, { block, kind: 'edit' });
    } catch {
      props.updateAttributes({ generatedHtml, outdated: true });
    } finally {
      props.updateAttributes({ isPending: false });
    }
  }
}

type BlockKey = `file:${string}`;

type AgendaEditionBlockState = {
  edited: boolean;
  fileId: string;
  generatedHtml: string | null;
  html: string;
  key: BlockKey;
  kind: 'file';
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
      edited: node.attrs.edited as boolean,
      fileId,
      generatedHtml: (node.attrs.generatedHtml as string | null) ?? null,
      html: tipTapNodeToHtml(node, editor.schema),
      key: `file:${fileId}`,
      kind: 'file',
      outdated: node.attrs.outdated as boolean,
    };
  }
}

class AgendaEditorDiff implements Iterable<AgendaEditionBlock> {
  private constructor(private readonly blocks: AgendaEditionBlock[]) {}

  *[Symbol.iterator]() {
    return yield* this.blocks;
  }

  static blocksOf(editor: Editor): AgendaEditionBlock[] {
    const blocks: AgendaEditionBlock[] = [];

    editor.state.doc.descendants((node) => {
      if (node.type.name !== AgendaFileBlock.name) return true;

      const block = AgendaEditionBlock.from(editor, node);
      if (block) blocks.push(block);

      return false;
    });

    return blocks;
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

  /** reuses the propositions screen operation, which carries the guards and warns the official report */
  keepOnly(nominationFileIds: readonly string[]): Promise<unknown> {
    return $api.docs.updateAgendaFiles({
      body: { nominationFileIds: [...nominationFileIds] },
      path: { agendaId: this.agendaId },
    });
  }

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
