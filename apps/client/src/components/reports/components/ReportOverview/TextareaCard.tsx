import { Card } from './Card';
import { TipTapEditor } from './TipTapEditor';
import type { FilesUploader } from './TipTapEditor/extensions/editor-file-uploader';

export type TextareaCardProps = {
  cardId: string;
  titleId: string;
  label: string;
  content: string | null;
  onContentChange: (content: string) => void;
  uploadFiles?: FilesUploader;
};

export const TextareaCard: React.FC<TextareaCardProps> = ({
  cardId,
  titleId,
  label,
  content,
  onContentChange,
  uploadFiles
}) => {
  return (
    <Card id={cardId}>
      <h2 id={titleId}>{label}</h2>
      <TipTapEditor
        value={content ?? undefined}
        onChange={onContentChange}
        ariaLabelledby={titleId}
        uploadFiles={uploadFiles}
      />
    </Card>
  );
};
