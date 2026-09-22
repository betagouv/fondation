import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import type { ReactNodeViewProps } from '@tiptap/react';

import { plainText, readsTheSame } from '@/features/documents/components/blocks/proposed-text';
import { tipTapNodeToHtml } from '@/features/documents/components/blocks/tiptap-node-to-html';
import { assertNever } from '@/utils/types.util';
import * as $api from '@api/sdk';
import type { FoundAgendaNominationFiles } from '@api/types';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { OfficialReportConclusionBlock } from './OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from './OfficialReportFileBlock';
import { OfficialReportIntroBlock } from './OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlock } from './OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlock } from './OfficialReportSectionTitleBlock';

export class OfficialReportBlockEmptied extends Error {
  constructor(readonly emptied: OfficialReportEditionBlockState) {
    super();
  }
}

type PendingChange =
  | { block: OfficialReportEditionBlock; kind: 'edit' }
  | { block: OfficialReportEditionBlock; kind: 'reset' };

export class OfficialReportBlocksModel {
  readonly blocks: readonly OfficialReportBlock[];
  readonly officialReportId: string;

  private readonly onDirtyChange: (isDirty: boolean) => void;
  private readonly pending = new Map<BlockKey, PendingChange>();
  private readonly persistor: OfficialReportEditionBlockPersistor;
  private state: Map<BlockKey, OfficialReportEditionBlock> | undefined;

  constructor(props: {
    blocks: readonly OfficialReportBlock[];
    officialReportId: string;
    onDirtyChange?: (isDirty: boolean) => void;
  }) {
    this.blocks = props.blocks;
    this.officialReportId = props.officialReportId;
    this.onDirtyChange = props.onDirtyChange ?? (() => {});

    this.persistor = new OfficialReportEditionBlockPersistor(this.officialReportId);
  }

  get isDirty(): boolean {
    return this.pending.size > 0;
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
  async save(): Promise<void> {
    for (const { block, kind } of this.pending.values()) {
      if (kind === 'edit' && !plainText(block.content).trim()) {
        throw new OfficialReportBlockEmptied(block.block);
      }
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
    this.onDirtyChange(false);
  }

  discard(): void {
    this.pending.clear();
    this.onDirtyChange(false);
  }

  /**
   * tiptap changes the provided html... In order to compare the user provided HTML
   * with the server one, we need to use the `Editor` as source of truth.
   */
  withEditor(editor: Editor): void {
    const state = new Map<BlockKey, OfficialReportEditionBlock>();

    editor.state.doc.descendants((node) => {
      const descriptor = officialReportBlocks.get(node.type.name);
      if (!descriptor) return true;

      const block = OfficialReportEditionBlock.from(editor, node);
      if (block) {
        state.set(block.key, block);
      }

      return false;
    });

    this.state = state;
  }

  onEditorUpdate(editor: Editor): void {
    if (!this.state) return;

    const changed = new Set(Array.from(OfficialReportEditorDiff.from(this.state, editor), ({ key }) => key));

    for (const block of OfficialReportEditorDiff.blocksOf(editor)) {
      const { agendaHtml, edited, generatedHtml } = block.block;

      // a stored edition typed back to the text giving it back would restore is no longer an
      // edition of it, and that text is the agenda's sentence whenever the agenda wrote one
      const restored = agendaHtml ?? generatedHtml;
      if (edited && restored && readsTheSame(block.content, restored)) {
        this.stage(block.key, { block, kind: 'reset' });
      } else if (changed.has(block.key)) {
        this.stage(block.key, { block, kind: 'edit' });
      } else if (this.pending.has(block.key)) {
        this.stage(block.key, null);
      }
    }
  }

  /**
   * removes the user edition in favor of the system generated text,
   * and unsets the `outdated` flag
   */
  async resetBlock(props: ReactNodeViewProps): Promise<void> {
    const { node, editor } = props;

    const block = OfficialReportEditionBlock.from(editor, node);
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
        .insertContentAt(
          { from: pos + 1, to: pos + node.nodeSize - 1 },
          node.attrs.agendaHtml ?? node.attrs.generatedHtml,
        )
        .run();

      const nextNode = editor.state.doc.nodeAt(pos);
      if (!nextNode) return;

      const nextBlock = OfficialReportEditionBlock.from(editor, nextNode);
      if (!nextBlock) return;

      this.stage(nextBlock.key, { block: nextBlock, kind: 'reset' });
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

      const block = OfficialReportEditionBlock.from(editor, node);
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

type DocNominationFileOutcomeEnum = NonNullable<
  FoundAgendaNominationFiles['items'][number]['outcome']
>['value'];

type BlockKey =
  | `intro`
  | `conclusion`
  | `section-title:${DocNominationFileOutcomeEnum}`
  | `section-intro:${DocNominationFileOutcomeEnum}`
  | `file:${string}`;

type EditionState = {
  agendaHtml: string | null;
  edited: boolean;
  generatedHtml: string | null;
  key: BlockKey;
};

export type OfficialReportEditionBlockState =
  | { kind: 'intro'; html: string; outdated: boolean }
  | { kind: 'conclusion'; html: string; outdated: boolean }
  | { kind: 'section-title'; outcome: DocNominationFileOutcomeEnum; text: string }
  | { kind: 'section-intro'; outcome: DocNominationFileOutcomeEnum; html: string }
  | { kind: 'file'; nominationFileId: string; html: string; outdated: boolean };

export class OfficialReportEditionBlock {
  get key(): BlockKey {
    return this.block.key;
  }

  get content(): string {
    return this.block.kind === 'section-title' ? this.block.text : this.block.html;
  }

  constructor(readonly block: OfficialReportEditionBlockState & EditionState) {}

  static from(editor: Editor, node: PMNode): OfficialReportEditionBlock | null {
    const state = this.state(editor, node);
    const key = this.key(node);
    if (!state || !key) return null;

    return new OfficialReportEditionBlock({
      ...state,
      key,
      agendaHtml: (node.attrs.agendaHtml as string | null) ?? null,
      edited: Boolean(node.attrs.edited),
      generatedHtml: (node.attrs.generatedHtml as string | null) ?? null,
    });
  }

  private computedOutdated(): boolean {
    return 'outdated' in this.block ? this.block.outdated : false;
  }

  equals(other: OfficialReportEditionBlock): boolean {
    return (
      this.block.key === other.block.key &&
      this.block.kind === other.block.kind &&
      this.content === other.content &&
      this.computedOutdated() === other.computedOutdated()
    );
  }

  private static key(node: PMNode): BlockKey | null {
    switch (node.type.name) {
      case OfficialReportIntroBlock.name:
        return 'intro';

      case OfficialReportConclusionBlock.name:
        return 'conclusion';

      case OfficialReportSectionTitleBlock.name:
        return `section-title:${node.attrs.outcome as DocNominationFileOutcomeEnum}`;

      case OfficialReportSectionIntroBlock.name:
        return `section-intro:${node.attrs.outcome as DocNominationFileOutcomeEnum}`;

      case OfficialReportFileBlock.name:
        return `file:${node.attrs.nominationFileId}`;

      default:
        return null;
    }
  }

  private static state(editor: Editor, node: PMNode): OfficialReportEditionBlockState | null {
    switch (node.type.name) {
      case OfficialReportIntroBlock.name:
        return {
          kind: 'intro',
          html: tipTapNodeToHtml(node, editor.schema),
          outdated: node.attrs.outdated,
        };
      case OfficialReportConclusionBlock.name:
        return {
          kind: 'conclusion',
          html: tipTapNodeToHtml(node, editor.schema),
          outdated: node.attrs.outdated,
        };
      case OfficialReportSectionTitleBlock.name:
        return {
          kind: 'section-title',
          outcome: node.attrs.outcome as DocNominationFileOutcomeEnum,
          text: node.textContent,
        };
      case OfficialReportSectionIntroBlock.name:
        return {
          kind: 'section-intro',
          outcome: node.attrs.outcome as DocNominationFileOutcomeEnum,
          html: tipTapNodeToHtml(node, editor.schema),
        };
      case OfficialReportFileBlock.name:
        return {
          kind: 'file',
          html: tipTapNodeToHtml(node, editor.schema),
          outdated: node.attrs.outdated as boolean,
          nominationFileId: node.attrs.nominationFileId as string,
        };

      default:
        return null;
    }
  }
}

class OfficialReportEditorDiff implements Iterable<OfficialReportEditionBlock> {
  private constructor(private readonly blocks: OfficialReportEditionBlock[]) {}

  *[Symbol.iterator]() {
    return yield* this.blocks;
  }

  static blocksOf(editor: Editor): OfficialReportEditionBlock[] {
    const blocks: OfficialReportEditionBlock[] = [];

    editor.state.doc.descendants((node) => {
      if (!officialReportBlocks.has(node.type.name)) return true;

      const block = OfficialReportEditionBlock.from(editor, node);
      if (block) blocks.push(block);

      return false;
    });

    return blocks;
  }

  static from(state: Map<BlockKey, OfficialReportEditionBlock>, editor: Editor): OfficialReportEditorDiff {
    const changedBlocks: OfficialReportEditionBlock[] = [];

    editor.state.doc.descendants((node) => {
      const descriptor = officialReportBlocks.get(node.type.name);
      if (!descriptor) return true;

      const nextBlock = OfficialReportEditionBlock.from(editor, node);
      if (!nextBlock) return false;

      const prevBlock = state.get(nextBlock.key);
      if (!prevBlock) return false;

      if (!prevBlock.equals(nextBlock)) {
        changedBlocks.push(nextBlock);
      }

      return false;
    });

    return new OfficialReportEditorDiff(changedBlocks);
  }
}

export class OfficialReportEditionBlockPersistor {
  constructor(private readonly officialReportId: string) {}

  async reset({ block }: OfficialReportEditionBlock): Promise<unknown> {
    switch (block.kind) {
      case 'intro':
        return $api.docs.resetOfficialReportIntro({ path: { officialReportId: this.officialReportId } });

      case 'conclusion':
        return $api.docs.resetOfficialReportConclusion({ path: { officialReportId: this.officialReportId } });

      case 'file':
        return $api.docs.resetOfficialReportFile({
          path: { officialReportId: this.officialReportId, nominationFileId: block.nominationFileId },
        });

      default:
        return;
    }
  }

  async persist({ block }: OfficialReportEditionBlock): Promise<unknown> {
    switch (block.kind) {
      case 'intro':
        return $api.docs.editOfficialReportIntro({
          path: { officialReportId: this.officialReportId },
          body: {
            outdated: block.outdated,
            html: block.html,
          },
        });

      case 'conclusion':
        return this.editConclusion(block);

      case 'section-title':
        return $api.docs.editOfficialReportSectionTitle({
          path: { officialReportId: this.officialReportId, outcome: block.outcome },
          body: { text: block.text },
        });

      case 'section-intro':
        return $api.docs.editOfficialReportSectionIntro({
          path: { officialReportId: this.officialReportId, outcome: block.outcome },
          body: { html: block.html },
        });

      case 'file':
        return $api.docs.editOfficialReportFile({
          path: { officialReportId: this.officialReportId, nominationFileId: block.nominationFileId },
          body: { html: block.html, outdated: block.outdated },
        });

      default:
        return assertNever(block);
    }
  }

  // hack to keep the `end-time` class on the first <p /> of the conclusion
  private async editConclusion(
    block: Extract<OfficialReportEditionBlockState, { kind: 'conclusion' }>,
  ): Promise<unknown> {
    const $doc = new DOMParser().parseFromString(block.html, 'text/html');
    $doc.body.querySelector('p')?.classList.add('end-time');

    const html = $doc.body.innerHTML;

    return $api.docs.editOfficialReportConclusion({
      path: { officialReportId: this.officialReportId },
      body: { html, outdated: block.outdated },
    });
  }
}

const officialReportBlocks = new Map(
  (
    [
      OfficialReportIntroBlock,
      OfficialReportSectionTitleBlock,
      OfficialReportSectionIntroBlock,
      OfficialReportFileBlock,
      OfficialReportConclusionBlock,
    ] as const
  ).map((descriptor) => [descriptor.name, descriptor]),
);
