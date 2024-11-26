import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { debounce } from "lodash";

export type TextareaCardProps = {
  id: string;
  label: string;
  content: string | null;
  rowsCount?: number;
  placeholder?: string;
  onContentChange: (content: string) => void;
};

export const TextareaCard: React.FC<TextareaCardProps> = ({
  id,
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
    <Card>
      <label className={cx("fr-h2")} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="whitespace-pre-line w-full"
        value={textareaContent ?? undefined}
        rows={rowsCount || 10}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </Card>
  );
};
