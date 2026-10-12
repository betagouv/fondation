import { useEditorState, type ReactNodeViewProps } from '@tiptap/react';

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
