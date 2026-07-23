import type { AnyExtension, JSONContent } from '@tiptap/core';
import { DOMSerializer, type Node as PMNode, type Schema } from '@tiptap/pm/model';
import { useEditorState, type ReactNodeViewProps } from '@tiptap/react';

import type { DetailedOfficialReportDocumentDto } from '@api/types';
import type { useOfficialReportBlockMutations } from '@queries/agenda.queries';

export type OfficialReportBlock = DetailedOfficialReportDocumentDto['blocks'][number];

export type OfficialReportMutations = ReturnType<typeof useOfficialReportBlockMutations>;

export type OfficialReportBlockCallbacks = {
  editIntro: () => void;
  resetIntro: () => void;
  editConclusion: () => void;
  resetConclusion: () => void;
  keepFile: (nominationFileId: string) => void;
  resetFile: (nominationFileId: string) => void;
  onHistory: () => void;
};

export type OfficialReportBlockOptions = { callbacks: OfficialReportBlockCallbacks | null };
export function callbacksOf(props: ReactNodeViewProps): OfficialReportBlockCallbacks | null {
  return (props.extension.options as OfficialReportBlockOptions).callbacks;
}

/**
 * A block is active when the selection overlaps its range. Computed from the live
 * position (`getPos`) rather than tiptap's `props.selected`, whose cached position and
 * strict bounds mislabel the neighbouring block for these `isolating` nodes.
 */
export function useBlockActive(props: ReactNodeViewProps): boolean {
  return useEditorState({
    editor: props.editor,
    selector: ({ editor }): boolean => {
      const pos = props.getPos();
      if (pos == null) return false;
      const { from, to } = editor.state.selection;
      return from < pos + props.node.nodeSize && to > pos;
    },
  });
}

export function serializeContent(node: PMNode, schema: Schema): string {
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(node.content);
  const div = document.createElement('div');
  div.append(fragment);
  return div.innerHTML;
}

/**
 * Single source of truth for one block kind, shared across the three layers:
 * - `map` / `attrsOf` feed the ViewModel (block -> TipTap).
 * - `blockKey` / `nodeKey` / `serialize` / `save` feed the Model (editor <-> server sync).
 */
export type BlockDescriptor = {
  block: OfficialReportBlock['kind'];
  name: string;
  handles(block: OfficialReportBlock): boolean;
  attrsOf(block: OfficialReportBlock): Record<string, unknown>;
  map(block: OfficialReportBlock, extensions: AnyExtension[]): JSONContent[];
  nodeKey(node: PMNode): string | null;
  serialize(node: PMNode, schema: Schema): string;
  save?(node: PMNode, content: string, mutations: OfficialReportMutations): void;
};
