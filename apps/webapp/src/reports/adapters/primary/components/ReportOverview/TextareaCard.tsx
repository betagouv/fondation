import { useEffect, useRef } from "react";
import { useAppSelector } from "../../hooks/react-redux";
import { Card } from "./Card";
import { TipTapEditor } from "./TipTapEditor";
import { selectEditor } from "../../selectors/selectEditor";

export type TextareaCardProps = {
  cardId: string;
  titleId: string;
  label: string;
  reportId: string;
};

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  reportId,
}) => {
  const editorContainerRef = useRef<HTMLElement>(null);
  const selectEditorArgs = {
    reportId,
  };
  const editor = useAppSelector((state) =>
    selectEditor(state, selectEditorArgs),
  );

  useEffect(() => {
    if (
      editor &&
      editorContainerRef.current &&
      !editorContainerRef.current.contains(
        // L'utilisationde "contains(editor.options.element)" ne fonctionne pas.
        document.getElementById(editor.options.element.id),
      )
    ) {
      editorContainerRef.current.append(editor.options.element);
    }
  }, [editor]);

  return (
    <Card ref={editorContainerRef} id={cardId}>
      <h2 id={titleId}>{label}</h2>
      {editor && <TipTapEditor editor={editor} />}
    </Card>
  );
};
