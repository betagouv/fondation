import type { Node as PMNode, Schema } from '@tiptap/pm/model';
import {
  generateJSON,
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type AnyExtension,
  type JSONContent,
  type ReactNodeViewProps,
} from '@tiptap/react';
import clsx from 'clsx';

import { OfficialReportDriftBanner } from '../OfficialReportDriftBanner';
import {
  callbacksOf,
  serializeContent,
  useBlockActive,
  type BlockDescriptor,
  type OfficialReportBlock,
  type OfficialReportBlockOptions,
  type OfficialReportMutations,
} from '../utils';

type JsonOfficialReportFileBlock = Extract<OfficialReportBlock, { kind: 'file' }>;
export const OfficialReportFileBlock = {
  block: 'file' satisfies OfficialReportBlock['kind'],
  name: 'fileBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportFileBlock {
    return block.kind === this.block;
  },

  attrsOf(block: JsonOfficialReportFileBlock) {
    return {
      nominationFileId: block.nominationFileId,
      edited: block.edited,
      outdated: block.outdated,
      generatedHtml: block.generatedHtml,
    };
  },

  map(block: JsonOfficialReportFileBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: this.attrsOf(block),
        content: generateJSON(block.html, extensions).content,
      },
    ];
  },

  nodeKey: (node: PMNode) => (node.attrs.nominationFileId ? `file:${node.attrs.nominationFileId}` : null),
  serialize: (node: PMNode, schema: Schema) => serializeContent(node, schema),
  save(node: PMNode, content: string, mutations: OfficialReportMutations) {
    mutations.editFile.mutate({
      nominationFileId: node.attrs.nominationFileId,
      html: content,
      outdated: Boolean(node.attrs.outdated),
    });
  },
} satisfies BlockDescriptor;

function FileBlockView(props: ReactNodeViewProps) {
  const callbacks = callbacksOf(props);
  const { edited, outdated, nominationFileId, generatedHtml } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      data-block-type="file"
      className={clsx('doc-block doc-block--file', {
        'doc-block--active': active,
        'doc-block--warning': (edited || outdated) && callbacks && nominationFileId,
      })}
    >
      <NodeViewContent />
      {outdated && callbacks && nominationFileId && (
        <OfficialReportDriftBanner
          generatedHtml={generatedHtml}
          onReset={() => callbacks.resetFile(nominationFileId)}
          onAcknowledge={() => callbacks.keepFile(nominationFileId)}
        />
      )}
    </NodeViewWrapper>
  );
}

export const OfficialReportFileBlockNode = Node.create<OfficialReportBlockOptions>({
  name: OfficialReportFileBlock.name,
  content: 'block*',
  marks: 'bold italic',
  isolating: true,
  selectable: false,
  draggable: false,
  addOptions: () => ({ callbacks: null }),
  addAttributes: () => ({
    // 'data-block-type': { default: null },
    nominationFileId: { default: null },
    edited: { default: false, rendered: false },
    outdated: { default: false },
    generatedHtml: { default: null, rendered: false },
  }),
  parseHTML: () => [{ tag: 'fon-block-file' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['fon-block-file', mergeAttributes(HTMLAttributes), 0],

  addNodeView: () => ReactNodeViewRenderer(FileBlockView, { selectedOnTextSelection: true, as: 'li' }),
});

/** Ordered container for the file blocks — a valid `fileBlock+` parent so undo/redo stay schema-valid. */
export const OfficialReportFileListNode = Node.create({
  name: 'fileListBlock',
  group: 'block',
  content: 'fileBlock+',
  parseHTML: () => [{ tag: 'ol[data-block-type="file-list"]' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['ol', mergeAttributes(HTMLAttributes, { 'data-block-type': 'file-list', class: 'doc-block__file-list' }), 0],
});
