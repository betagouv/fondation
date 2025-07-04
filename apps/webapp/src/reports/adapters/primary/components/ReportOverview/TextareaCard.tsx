import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import {
  DeleteImages,
  InsertImages,
  RedoImages,
  TipTapEditor,
} from "./TipTapEditor";

export type TextareaCardProps = {
  cardId: string;
  titleId: string;
  label: string;
  content: string | null;
  onContentChange: (content: string) => void;
  insertImages: InsertImages;
  deleteImages: DeleteImages;
  redoImages: RedoImages;
};

const TEXT_AREA_DEBOUNCE_TIME = 400;

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  content,
  onContentChange,
  insertImages,
  deleteImages,
  redoImages,
}) => {
  const [textareaContent, setTextareaContent] = useState(content);

  const debouncedOnContentChange = useRef(
    debounce(onContentChange, TEXT_AREA_DEBOUNCE_TIME),
  );

  const handleChange = useCallback((value: string) => {
    setTextareaContent(value);
    debouncedOnContentChange.current(value);
  }, []);

  useEffect(() => {
    debouncedOnContentChange.current = debounce(
      onContentChange,
      TEXT_AREA_DEBOUNCE_TIME,
    );
  }, [onContentChange]);

  return (
    <Card id={cardId}>
      <h2 id={titleId}>{label}</h2>
      <TipTapEditor
        value={textareaContent ?? undefined}
        onChange={handleChange}
        ariaLabelledby={titleId}
        insertImages={insertImages}
        deleteImages={deleteImages}
        redoImages={redoImages}
      />
    </Card>
  );
};
