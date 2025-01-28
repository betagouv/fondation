// src/Tiptap.tsx
import {
  BubbleMenu,
  EditorProvider,
  Extension,
  FloatingMenu,
} from "@tiptap/react";
import { StarterKitOptions } from "@tiptap/starter-kit";

export const Tiptap = ({
  extensions,
  content,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extensions: Extension<StarterKitOptions, any>[];
  content: string;
}) => {
  return (
    <EditorProvider extensions={extensions} content={content}>
      <FloatingMenu editor={null}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={null}>This is the bubble menu</BubbleMenu>
    </EditorProvider>
  );
};
