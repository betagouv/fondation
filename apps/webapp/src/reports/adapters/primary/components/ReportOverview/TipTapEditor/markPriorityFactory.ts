import { Editor } from "@tiptap/react";

export const markPriorityFactory =
  (editor: Editor) => (mark: string, options?: { level: number }) => {
    return editor.isFocused && editor.isActive(mark, options)
      ? "primary"
      : "tertiary";
  };

export const markPriorityFactory2 = (
  editor: Editor,
  mark: string,
  options?: { level: number },
) => {
  return editor.isFocused && editor.isActive(mark, options)
    ? "primary"
    : "tertiary";
};
