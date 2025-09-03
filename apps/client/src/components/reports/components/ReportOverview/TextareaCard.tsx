import { useCallback, useRef, useState } from 'react';
import { Card } from './Card';
import { type DeleteImages, type InsertImages, type RedoImages, TipTapEditor } from './TipTapEditor';

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

const useDebounce = (callback: (value: string) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );
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

  const debouncedOnContentChange = useDebounce(onContentChange, TEXT_AREA_DEBOUNCE_TIME);

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
