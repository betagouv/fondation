import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { TipTapEditor } from "./TipTapEditor";

export type TextareaCardProps = {
  cardId: string;
  titleId: string;
  label: string;
  content: string | null;
  onContentChange: (content: string) => void;
};

const TEXT_AREA_DEBOUNCE_TIME = 400;

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  content,
  onContentChange,
}) => {
  const [textareaContent, setTextareaContent] = useState(content);

  const debouncedOnContentChange = useMemo(
    () => debounce(onContentChange, TEXT_AREA_DEBOUNCE_TIME),
    [onContentChange],
  );

  const handleChange = useCallback(
    (value: string) => {
      setTextareaContent(value);
      debouncedOnContentChange(value);
    },
    [debouncedOnContentChange],
  );

  useEffect(() => {
    return () => {
      debouncedOnContentChange.cancel();
    };
  }, [debouncedOnContentChange]);

  return (
    <Card id={cardId}>
      <h2 id={titleId}>{label}</h2>
      <TipTapEditor
        value={textareaContent ?? undefined}
        onChange={handleChange}
        ariaLabelledby={titleId}
      />
    </Card>
  );
};
