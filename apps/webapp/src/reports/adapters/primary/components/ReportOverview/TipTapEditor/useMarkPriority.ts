import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { HeadingLevel } from "./constant";
import { markPriorityFactory2 } from "./markPriorityFactory";

export const useMarkPriority = (
  mark?: string,
  options?: { level: HeadingLevel },
) => {
  const { editor } = useCurrentEditor();
  const priority = useEditorState({
    editor,
    selector: (ctx) => {
      if (!mark) return "tertiary";
      return ctx.editor
        ? markPriorityFactory2(ctx.editor, mark, options)
        : "tertiary";
    },
  });
  return priority || "tertiary";
};
