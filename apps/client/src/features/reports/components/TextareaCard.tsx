import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';
import { TipTapEditor } from '@/shared/ui/tip-tap-editor';
import type { FilesUploader } from '@/shared/ui/tip-tap-editor/extensions/editor-file-uploader';

import { Card } from './Card';

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
  uploadFiles,
}) => {
  const { isArchived } = useArchivedSession();

  return (
    <Card id={cardId}>
      <h2 id={titleId}>{label}</h2>

      {isArchived ? (
        <div
          className="fr-p-4v rounded bg-(--background-alt-grey)"
          dangerouslySetInnerHTML={{ __html: content ?? '' }}
        />
      ) : (
        <TipTapEditor
          value={content ?? undefined}
          onChange={onContentChange}
          ariaLabelledby={titleId}
          uploadFiles={uploadFiles}
        />
      )}
    </Card>
  );
};
