import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import type { ReactNodeViewProps } from '@tiptap/react';

import { tipTapNodeToHtml } from '@/features/documents/components/blocks/tiptap-node-to-html';
import type { DocNominationFileOutcomeEnum } from '@/types/enums.types';
import { assertNever } from '@/utils/types.util';
import * as $api from '@api/sdk';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { OfficialReportConclusionBlock } from './OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from './OfficialReportFileBlock';
import { OfficialReportIntroBlock } from './OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlock } from './OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlock } from './OfficialReportSectionTitleBlock';

export class OfficialReportBlocksModel {
  readonly blocks: readonly OfficialReportBlock[];
  readonly officialReportId: string;

  private readonly persistor: OfficialReportEditionBlockPersistor;
  private state: Map<BlockKey, OfficialReportEditionBlock> | undefined;

  constructor(props: { officialReportId: string; blocks: readonly OfficialReportBlock[] }) {
    this.blocks = props.blocks;
    this.officialReportId = props.officialReportId;

    this.persistor = new OfficialReportEditionBlockPersistor(this.officialReportId);
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

  /** synchronizes text edition with the backend  */
  async onEditorUpdate(editor: Editor): Promise<void> {
    if (!this.state) return;

    const diff = OfficialReportEditorDiff.from(this.state, editor);
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

    const block = OfficialReportEditionBlock.from(editor, node);
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

      const nextBlock = OfficialReportEditionBlock.from(editor, nextNode);
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

type BlockKey =
  | `intro`
  | `conclusion`
  | `section-title:${DocNominationFileOutcomeEnum}`
  | `section-intro:${DocNominationFileOutcomeEnum}`
  | `file:${string}`;

export type OfficialReportEditionBlockState =
  | { kind: 'intro'; key: BlockKey; html: string; outdated: boolean }
  | { kind: 'conclusion'; key: BlockKey; html: string; outdated: boolean }
  | { kind: 'section-title'; key: BlockKey; outcome: DocNominationFileOutcomeEnum; text: string }
  | { kind: 'section-intro'; key: BlockKey; outcome: DocNominationFileOutcomeEnum; html: string }
  | { kind: 'file'; key: BlockKey; nominationFileId: string; html: string; outdated: boolean };

export class OfficialReportEditionBlock {
  get key(): BlockKey {
    return this.block.key;
  }

  constructor(readonly block: OfficialReportEditionBlockState) {}

  static from(editor: Editor, node: PMNode): OfficialReportEditionBlock | null {
    const block = this.state(editor, node);
    if (!block) return null;

    return new OfficialReportEditionBlock(block);
  }

  private computedOutdated(): boolean {
    return 'outdated' in this.block ? this.block.outdated : false;
  }

  private computedContent(): string {
    return this.block.kind === 'section-title' ? this.block.text : this.block.html;
  }

  equals(other: OfficialReportEditionBlock): boolean {
    return (
      this.block.key === other.block.key &&
      this.block.kind === other.block.kind &&
      this.computedContent() === other.computedContent() &&
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
    const key = this.key(node);
    if (!key) return null;

    switch (node.type.name) {
      case OfficialReportIntroBlock.name:
        return {
          kind: 'intro',
          key,
          html: tipTapNodeToHtml(node, editor.schema),
          outdated: node.attrs.outdated,
        };
      case OfficialReportConclusionBlock.name:
        return {
          kind: 'conclusion',
          key,
          html: tipTapNodeToHtml(node, editor.schema),
          outdated: node.attrs.outdated,
        };
      case OfficialReportSectionTitleBlock.name:
        return {
          kind: 'section-title',
          key,
          outcome: node.attrs.outcome as DocNominationFileOutcomeEnum,
          text: node.textContent,
        };
      case OfficialReportSectionIntroBlock.name:
        return {
          kind: 'section-intro',
          key,
          outcome: node.attrs.outcome as DocNominationFileOutcomeEnum,
          html: tipTapNodeToHtml(node, editor.schema),
        };
      case OfficialReportFileBlock.name:
        return {
          kind: 'file',
          key,
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
