import { generateJSON, type JSONContent } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';

import { officialReportBlocks } from './blocks';
import type { OfficialReportViewModel } from './official-report.view-model';
import type { BlockDescriptor, OfficialReportMutations } from './utils';

type KeyedNode = { descriptor: BlockDescriptor; node: PMNode; pos: number; key: string };

/** Signature = content + outdated attr, so an attr-only change (e.g. keep → undo) is detected. */
function signature(node: PMNode, content: string): string {
  return `${node.attrs.outdated ? '1' : '0'}:${content}`;
}

/**
 * Owns the block logic. The editor is the source of truth for the user's text:
 * once loaded we keep the client state and never reconcile it against the server.
 * `#synced` holds the content last persisted per block, so the debounced `persist`
 * only saves what actually changed.
 */
export class OfficialReportModel {
  #synced = new Map<string, string>();

  constructor(
    private readonly editor: Editor,
    public mutations: OfficialReportMutations,
    private readonly viewModel: OfficialReportViewModel,
  ) {}

  #keyedNodes(): KeyedNode[] {
    const result: KeyedNode[] = [];
    this.editor.state.doc.descendants((node, pos) => {
      const descriptor = officialReportBlocks.get(node.type.name);
      if (!descriptor) return true;

      const key = descriptor.nodeKey(node);
      if (key) result.push({ descriptor, node, pos, key });
      return false;
    });
    return result;
  }

  #find(key: string): KeyedNode | undefined {
    return this.#keyedNodes().find((n) => n.key === key);
  }

  captureSynced(): void {
    this.#synced.clear();
    for (const { descriptor, node, key } of this.#keyedNodes()) {
      this.#synced.set(key, signature(node, descriptor.serialize(node, this.editor.schema)));
    }
  }

  persist(): void {
    for (const { descriptor, node, key } of this.#keyedNodes()) {
      if (!descriptor.save) continue;
      const content = descriptor.serialize(node, this.editor.schema);
      if (this.#synced.get(key) === signature(node, content)) continue;
      this.#synced.set(key, signature(node, content));
      descriptor.save(node, content, this.mutations);
    }
  }

  /** Keep: forward the current text to the backend and drop the banner locally. */
  #acknowledge(key: string, attrs: Record<string, unknown>, persist: (html: string) => void): void {
    const found = this.#find(key);
    if (!found) return;
    const html = found.descriptor.serialize(found.node, this.editor.schema);
    const nextAttrs = { ...found.node.attrs, ...attrs };
    const tr = this.editor.state.tr.setNodeMarkup(found.pos, undefined, nextAttrs);
    this.editor.view.dispatch(tr);
    this.#synced.set(key, `${nextAttrs.outdated ? '1' : '0'}:${html}`);
    persist(html);
  }

  /**
   * Reset: swap the block to its generated version and refresh the whole document,
   * then forward the reset to the backend.
   */
  #refresh(
    key: string,
    matches: (node: JSONContent) => boolean,
    attrs: Record<string, unknown>,
    persist: () => void,
  ): void {
    const generatedHtml = this.#find(key)?.node.attrs.generatedHtml;
    if (generatedHtml == null) return;

    const content = generateJSON(generatedHtml, this.viewModel.extensions).content ?? [];
    const doc = this.editor.getJSON();
    const swap = (nodes: JSONContent[] | undefined): void => {
      for (const node of nodes ?? []) {
        if (matches(node)) {
          node.content = content;
          node.attrs = { ...node.attrs, ...attrs, generatedHtml: null };
        } else swap(node.content);
      }
    };
    swap(doc.content);

    this.editor.commands.setContent(doc, { emitUpdate: false });
    this.captureSynced();
    persist();
  }

  editIntro = (): void => {
    this.#acknowledge('intro', { outdated: false }, (html) =>
      this.mutations.editIntro.mutate({ html, outdated: false }),
    );
  };

  resetIntro = (): void => {
    this.#refresh(
      'intro',
      (n) => n.type === 'introBlock',
      { outdated: false },
      () => this.mutations.resetIntro.mutate(),
    );
  };

  editConclusion = (): void => {
    this.#acknowledge('conclusion', { outdated: false }, (html) =>
      this.mutations.editConclusion.mutate({ html, outdated: false }),
    );
  };

  resetConclusion = (): void => {
    this.#refresh(
      'conclusion',
      (n) => n.type === 'conclusionBlock',
      { outdated: false },
      () => this.mutations.resetConclusion.mutate(),
    );
  };

  keepFile = (nominationFileId: string): void => {
    this.#acknowledge(`file:${nominationFileId}`, { outdated: false }, (html) =>
      this.mutations.editFile.mutate({ nominationFileId, html, outdated: false }),
    );
  };

  resetFile = (nominationFileId: string): void => {
    this.#refresh(
      `file:${nominationFileId}`,
      (n) => n.type === 'fileBlock' && n.attrs?.nominationFileId === nominationFileId,
      { outdated: false },
      () => this.mutations.resetFile.mutate({ nominationFileId }),
    );
  };
}
