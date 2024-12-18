import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { debounce } from "lodash";

export type TextareaCardProps = {
  cardId: string;
  titleId: string;
  label: string;
  content: string | null;
  rowsCount?: number;
  placeholder?: string;
  onContentChange: (content: string) => void;
};

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  content,
  rowsCount,
  placeholder,
  onContentChange,
}) => {
  const [textareaContent, setTextareaContent] = useState(content);

  const debouncedOnContentChange = useMemo(
    () => debounce(onContentChange, 400),
    [onContentChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextareaContent(e.target.value);
      debouncedOnContentChange(e.target.value);
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
      <h2 className={cx("fr-h2")} id={titleId}>
        {label}
      </h2>
      <textarea
        aria-labelledby={titleId}
        className="w-full whitespace-pre-line"
        value={textareaContent ?? undefined}
        rows={rowsCount || 10}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </Card>
  );
};
