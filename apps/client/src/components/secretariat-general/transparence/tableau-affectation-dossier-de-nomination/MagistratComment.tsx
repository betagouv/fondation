import { Input } from '@codegouvfr/react-dsfr/Input';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Magistrat, Role } from 'shared-models';
import { useDebounce } from 'use-debounce';
import { useUpdateCommentAccessMutation } from '../../../../react-query/mutations/sg/comment-access.mutations';
import { useUpdateNominationFileCommentMutation } from '../../../../react-query/mutations/sg/update-nomination-file-comment';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { useValidateSessionFromCookie } from '../../../../react-query/queries/validate-session-from-cookie.query';
import { UserChipsSelect } from '../../../shared/UserChipsSelect';

export type MagistratCommentProps = {
  nominationFileId: string;
  initialComment?: string | null;
  initialCommentAccessUserIds?: string[];
  formation: Magistrat.Formation;
};

export const MagistratComment: FC<MagistratCommentProps> = ({
  nominationFileId,
  initialComment,
  initialCommentAccessUserIds,
  formation
}) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useValidateSessionFromCookie();
  const isSG = user?.role === Role.ADJOINT_SECRETAIRE_GENERAL;

  const [comment, setComment] = useState(initialComment || '');
  const [debouncedComment] = useDebounce(comment, 1000);
  const { mutate: updateComment } = useUpdateNominationFileCommentMutation();

  const [selectedAccessUserIds, setSelectedAccessUserIds] = useState<string[]>(
    initialCommentAccessUserIds || []
  );
  const { mutate: updateCommentAccess } = useUpdateCommentAccessMutation();

  const { data: eligibleUsers } = useGetUsersByFormation(formation);

  useEffect(() => {
    if (isSG && debouncedComment !== initialComment && sessionId) {
      updateComment({ sessionId, nominationFileId, comment: debouncedComment || null });
    }
  }, [debouncedComment, initialComment, nominationFileId, updateComment, sessionId, isSG]);

  const handleAccessChange = (newSelectedUserIds: string[]) => {
    setSelectedAccessUserIds(newSelectedUserIds);
    if (sessionId) {
      updateCommentAccess({
        sessionId,
        nominationFileId,
        userIds: newSelectedUserIds
      });
    }
  };

  const canAccessComment = user?.id && initialCommentAccessUserIds?.includes(user.id);
  const showComment = isSG || canAccessComment;

  if (!showComment) {
    return null;
  }

  return (
    <div>
      {isSG ? (
        <>
          <Input
            label="Commentaire"
            textArea
            nativeTextAreaProps={{
              value: comment,
              onChange: (e) => setComment(e.target.value),
              maxLength: 50000,
              rows: 6,
              placeholder: 'Saisissez un commentaire...'
            }}
          />
          <p className="mt-1 text-sm text-gray-500">{comment.length} / 50 000 caractères</p>

          <div className="mt-4">
            <UserChipsSelect
              availableUsers={eligibleUsers || []}
              selectedUserIds={selectedAccessUserIds}
              onSelectionChange={handleAccessChange}
              placeholder="Rechercher un utilisateur..."
              label="Partager ce commentaire avec"
            />
          </div>
        </>
      ) : (
        <>
          <label className="text-xl font-semibold">Commentaire</label>
          <div className="mt-2 whitespace-pre-line rounded border border-gray-300 bg-gray-50 p-4">
            {initialComment || 'Aucun commentaire'}
          </div>
        </>
      )}
    </div>
  );
};
