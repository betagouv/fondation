import { MenuBar } from "./MenuBar";

import {
  Editor,
  EditorConsumer,
  EditorContent,
  EditorContext,
} from "@tiptap/react";
import { FC } from "react";

export type TipTapEditorProps = {
  editor: Editor;
};

export const TipTapEditor: FC<TipTapEditorProps> = ({ editor }) => {
  return (
    <EditorContext.Provider value={{ editor }}>
      <MenuBar editor={editor} />
      <EditorConsumer>
        {({ editor: currentEditor }) => (
          <EditorContent editor={currentEditor} />
        )}
      </EditorConsumer>
    </EditorContext.Provider>
  );
};
