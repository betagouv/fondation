import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useId, useState } from 'react';
import { useParams } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';

import { MagistratCommentEdit } from './MagistratCommentEdit';
import { MagistratCommentView } from './MagistratCommentView';

export function MagistratComment(props: {
  id: string;
  initialComment?: string | null;
  nominationFileId: string;
}) {
  const { nominationFileId, initialComment } = props;

  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isEditing, setEditing] = useState<boolean>(false);
  const isEditable = isSg && !!sessionId;

  const id = useId();

  const toggleEdition = useCallback(() => {
    setEditing((editing) => !editing);
  }, [setEditing]);

  const showComment = !isArchived && (isSg || initialComment !== null);
  if (!showComment) return null;

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
        <label htmlFor={id} className="text-xl font-semibold">
          Historique proposition
        </label>

        {!isArchived && isEditable ? (
          isEditing ? (
            <Button
              size="small"
              onClick={toggleEdition}
              title="Sauvegarder l'historique"
              priority="primary"
              iconId="ri-check-line"
            >
              Ok
            </Button>
          ) : (
            <Button
              onClick={toggleEdition}
              title="Éditer l'historique"
              priority="tertiary no outline"
              size="small"
              iconId="fr-icon-edit-fill"
            />
          )
        ) : null}
      </div>

      {!isArchived && isEditable && isEditing ? (
        <MagistratCommentEdit
          key={
            // to unmount the component
            `magistrat-comment-edit-${sessionId}-${nominationFileId}`
          }
          id={id}
          sessionId={sessionId}
          initialComment={initialComment}
          nominationFileId={nominationFileId}
        />
      ) : (
        <MagistratCommentView id={id} initialComment={initialComment} />
      )}
    </div>
  );
}
