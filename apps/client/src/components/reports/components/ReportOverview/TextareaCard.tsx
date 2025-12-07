import { useCallback, useState } from 'react';
import { Card } from './Card';
import { type DeleteImages, type InsertImages, type RedoImages, TipTapEditor } from './TipTapEditor';
import { useDebouncedCallback } from 'use-debounce';

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

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  content,
  onContentChange,
  insertImages,
  deleteImages,
  redoImages
}) => {
  const [textareaContent, setTextareaContent] = useState(content);
  const debouncedOnContentChange = useDebouncedCallback(onContentChange, 400);

  const handleChange = useCallback(
    (value: string) => {
      setTextareaContent(value);
      debouncedOnContentChange(value);
    },
    [debouncedOnContentChange]
  );

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
