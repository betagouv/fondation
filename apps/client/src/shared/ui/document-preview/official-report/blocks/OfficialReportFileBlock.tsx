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

import { useBlockActive } from '../hooks/useBlockActive';
import { OfficialReportDriftBanner } from '../OfficialReportDriftBanner';
import {
  useOfficialReportBlockFileEditMutation,
  useOfficialReportBlockFileResetMutation,
} from '@queries/agenda.queries';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { tipTapNodeToHtml } from './tiptap-node-to-html';

type JsonOfficialReportFileBlock = Extract<OfficialReportBlock, { kind: 'file' }>;
export const OfficialReportFileBlock = {
  block: 'file' satisfies OfficialReportBlock['kind'],
  name: 'fileBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportFileBlock {
    return block.kind === this.block;
  },

  map(
    officialReportId: string,
    block: JsonOfficialReportFileBlock,
    extensions: AnyExtension[],
  ): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: {
          officialReportId,
          nominationFileId: block.nominationFileId,
          edited: block.edited,
          outdated: block.outdated,
          generatedHtml: block.generatedHtml,
        },
        content: generateJSON(block.html, extensions).content,
      },
    ];
  },
};

function FileBlockView(props: ReactNodeViewProps) {
  const { edited, outdated, nominationFileId, generatedHtml, officialReportId } = props.node.attrs;
  const active = useBlockActive(props);

  const { mutate: resetFile } = useOfficialReportBlockFileResetMutation(officialReportId);
  const { mutate: editFile } = useOfficialReportBlockFileEditMutation(officialReportId);

  const onReset = () => {
    resetFile(
      { nominationFileId },
      {
        async onSuccess() {
          props.updateAttributes({ ...props.node.attrs, outdated: false });

          const pos = props.getPos();
          if (pos == null) return;
          props.editor.commands.insertContentAt(
            { from: pos + 1, to: pos + props.node.nodeSize - 1 },
            generatedHtml,
          );
        },
      },
    );
  };

  const onAcknowledge = () => {
    const html = tipTapNodeToHtml(props.node, props.editor.schema);
    editFile(
      { html, outdated: false, nominationFileId },
      {
        onSuccess() {
          props.updateAttributes({ ...props.node.attrs, outdated: false });
        },
      },
    );
  };

  return (
    <NodeViewWrapper
      data-block-type="file"
      className={clsx('doc-block doc-block--file', {
        'doc-block--active': active,
        'doc-block--warning': (edited || outdated) && nominationFileId,
      })}
    >
      <NodeViewContent />
      {outdated && (
        <OfficialReportDriftBanner
          onReset={onReset}
          onAcknowledge={onAcknowledge}
          generatedHtml={generatedHtml}
        />
      )}
    </NodeViewWrapper>
  );
}

export const OfficialReportFileBlockNode = Node.create({
  name: OfficialReportFileBlock.name,
  content: 'block*',
  marks: 'bold italic',
  isolating: true,
  selectable: false,
  draggable: false,
  addAttributes: () => ({
    edited: { default: false, rendered: false },
    outdated: { default: false },
    nominationFileId: { default: null },
    generatedHtml: { default: null, rendered: false },
    officialReportId: { default: null, rendered: false },
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
