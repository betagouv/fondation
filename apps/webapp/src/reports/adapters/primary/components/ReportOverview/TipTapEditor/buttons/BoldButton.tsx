import { Editor } from "@tiptap/react";
import { headingLevels } from "../constant";
import { EditorButton } from "./EditorButton";

export const BoldButton = () => {
  const getDisabled = (editor: Editor) => {
    const isHeadingActive = !!headingLevels.find((level) =>
      editor.isActive("heading", { level }),
    );
    return !editor.can().chain().focus().toggleBold().run() || isHeadingActive;
  };

  const toggleBold = (editor: Editor) => () => {
    editor.chain().focus().toggleBold().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-bold"
      title="Gras"
      mark="bold"
      disabledFactory={getDisabled}
      onClickFactory={toggleBold}
    />
  );
};
