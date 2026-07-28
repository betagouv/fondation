import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';

import type { DocNominationFileOutcomeEnum } from '@/types/enums.types';
import { assertNever } from '@/utils/types.util';
import * as $api from '@api/sdk';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { OfficialReportConclusionBlock } from './OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from './OfficialReportFileBlock';
import { OfficialReportIntroBlock } from './OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlock } from './OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlock } from './OfficialReportSectionTitleBlock';
import { tipTapNodeToHtml } from './tiptap-node-to-html';

export class OfficialReportBlocksModel {
  readonly blocks: readonly OfficialReportBlock[];
  readonly officialReportId: string;

  private readonly persistor: OfficialReportEditionBlockPersistor;
  private state: Map<BlockKey, BlockSnapshot> | undefined;

  constructor(props: { officialReportId: string; blocks: readonly OfficialReportBlock[] }) {
    this.blocks = props.blocks;
    this.officialReportId = props.officialReportId;

    this.persistor = new OfficialReportEditionBlockPersistor(this.officialReportId);
  }

  withEditor(editor: Editor): void {
    const state = new Map<BlockKey, BlockSnapshot>();

    editor.state.doc.descendants((node) => {
      const descriptor = officialReportBlocks.get(node.type.name);
      if (!descriptor) return true;

      const block = new OfficialReportEditorNode(node, editor).toBlock();
      if (block) {
        state.set(block.key, makeSnapshot(block.kind === 'section-title' ? block.text : block.html));
      }

      return false;
    });

    this.state = state;
  }

  async onEditorUpdate(editor: Editor): Promise<void> {
    if (!this.state) return;

    const diff = OfficialReportEditorDiff.from(this.state, editor);
    for (const block of diff) {
      await this.persistor.persist(block);
      this.state.set(block.key, makeSnapshot(block.kind === 'section-title' ? block.text : block.html));
    }
  }
}

type BlockKey =
  | `intro`
  | `conclusion`
  | `section-title:${DocNominationFileOutcomeEnum}`
  | `section-intro:${DocNominationFileOutcomeEnum}`
  | `file:${string}`;

const BRAND = Symbol();
type Branded<T, Brand extends string> = T & { [BRAND]: Brand };

type BlockSnapshot = Branded<string, 'BlockSnapshot'>;
function makeSnapshot(snapshot: string): BlockSnapshot {
  return snapshot as BlockSnapshot;
}

type OfficialReportEditionBlock =
  | { kind: 'intro' | 'conclusion'; key: BlockKey; html: string; outdated: boolean }
  | { kind: 'section-title'; key: BlockKey; outcome: DocNominationFileOutcomeEnum; text: string }
  | { kind: 'section-intro'; key: BlockKey; outcome: DocNominationFileOutcomeEnum; html: string }
  | { kind: 'file'; key: BlockKey; nominationFileId: string; html: string; outdated: boolean };

class OfficialReportEditorDiff implements Iterable<OfficialReportEditionBlock> {
  private constructor(private readonly blocks: OfficialReportEditionBlock[]) {}

  *[Symbol.iterator]() {
    return yield* this.blocks;
  }

  static from(state: Map<BlockKey, BlockSnapshot>, editor: Editor): OfficialReportEditorDiff {
    const changedBlocks: OfficialReportEditionBlock[] = [];

    editor.state.doc.descendants((node) => {
      const descriptor = officialReportBlocks.get(node.type.name);
      if (!descriptor) return true;

      const result = new OfficialReportEditorNode(node, editor).compare(state);
      if (result.state === 'CHANGED') {
        changedBlocks.push(result.block);
      }

      return false;
    });

    return new OfficialReportEditorDiff(changedBlocks);
  }
}

class OfficialReportEditorNode {
  constructor(
    readonly node: PMNode,
    readonly editor: Editor,
  ) {}

  compare(
    map: Map<BlockKey, BlockSnapshot>,
  ): { state: 'IDLE' } | { state: 'CHANGED'; block: OfficialReportEditionBlock } {
    const block = this.toBlock();
    if (!block) return { state: 'IDLE' };

    const snapshot = map.get(block.key);
    if (!snapshot) return { state: 'IDLE' };

    const changed = block.kind === 'section-title' ? block.text !== snapshot : block.html !== snapshot;

    if (!changed) return { state: 'IDLE' };

    console.debug('⚠ CHANGED');
    console.table({
      kind: block.kind,
      snapshot,
      html: block.kind === 'section-title' ? block.text : block.html,
    });

    return { state: 'CHANGED', block };
  }

  toBlock(): OfficialReportEditionBlock | null {
    const key = this.key();
    if (!key) return null;

    switch (this.node.type.name) {
      case OfficialReportIntroBlock.name:
        return {
          kind: 'intro',
          key,
          html: this.htmlContent(),
          outdated: this.node.attrs.outdated,
        };
      case OfficialReportConclusionBlock.name:
        return {
          kind: 'conclusion',
          key,
          html: this.htmlContent(),
          outdated: this.node.attrs.outdated,
        };
      case OfficialReportSectionTitleBlock.name:
        return {
          kind: 'section-title',
          key,
          outcome: this.node.attrs.outcome as DocNominationFileOutcomeEnum,
          text: this.node.textContent,
        };
      case OfficialReportSectionIntroBlock.name:
        return {
          kind: 'section-intro',
          key,
          outcome: this.node.attrs.outcome as DocNominationFileOutcomeEnum,
          html: this.htmlContent(),
        };
      case OfficialReportFileBlock.name:
        return {
          kind: 'file',
          key,
          html: this.htmlContent(),
          outdated: this.node.attrs.outdated as boolean,
          nominationFileId: this.node.attrs.nominationFileId as string,
        };

      default:
        return null;
    }
  }

  private key(): BlockKey | null {
    switch (this.node.type.name) {
      case OfficialReportIntroBlock.name:
        return 'intro';

      case OfficialReportConclusionBlock.name:
        return 'conclusion';

      case OfficialReportSectionTitleBlock.name:
        return `section-title:${this.node.attrs.outcome as DocNominationFileOutcomeEnum}`;

      case OfficialReportSectionIntroBlock.name:
        return `section-intro:${this.node.attrs.outcome as DocNominationFileOutcomeEnum}`;

      case OfficialReportFileBlock.name:
        return `file:${this.node.attrs.nominationFileId}`;

      default:
        return null;
    }
  }

  private htmlContent(): string {
    return tipTapNodeToHtml(this.node, this.editor.schema);
  }
}

class OfficialReportEditionBlockPersistor {
  constructor(private readonly officialReportId: string) {}

  async persist(block: OfficialReportEditionBlock): Promise<unknown> {
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
        return $api.docs.editOfficialReportConclusion({
          path: { officialReportId: this.officialReportId },
          body: {
            html: block.html,
            outdated: block.outdated,
          },
        });

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
}

const OFFICIAL_REPORT_BLOCKS = [
  OfficialReportIntroBlock,
  OfficialReportSectionTitleBlock,
  OfficialReportSectionIntroBlock,
  OfficialReportFileBlock,
  OfficialReportConclusionBlock,
] as const;

const officialReportBlocks = new Map(
  OFFICIAL_REPORT_BLOCKS.map((descriptor) => [descriptor.name, descriptor]),
);
