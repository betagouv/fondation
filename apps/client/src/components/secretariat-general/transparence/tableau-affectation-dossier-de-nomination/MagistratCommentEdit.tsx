import { Input } from '@codegouvfr/react-dsfr/Input';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Magistrat } from 'shared-models';
import { useDebounce } from 'use-debounce';
import { useUpdateCommentAccessMutation } from '../../../../react-query/mutations/sg/comment-access.mutations';
import { useUpdateNominationFileCommentMutation } from '../../../../react-query/mutations/sg/update-nomination-file-comment';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { UserChipsSelect } from '../../../shared/UserChipsSelect';

export type MagistratCommentEditProps = {
  nominationFileId: string;
  sessionId: string;
  initialComment?: string | null;
  initialCommentAccessUserIds?: string[];
  formation: Magistrat.Formation;
};

export const MagistratCommentEdit: FC<MagistratCommentEditProps> = ({
  nominationFileId,
  sessionId,
  initialComment,
  initialCommentAccessUserIds,
  formation
}) => {
  const [comment, setComment] = useState(initialComment || '');
  const [debouncedComment] = useDebounce(comment, 1000);
  const { mutate: updateComment } = useUpdateNominationFileCommentMutation();

  const [selectedAccessUserIds, setSelectedAccessUserIds] = useState<string[]>(
    initialCommentAccessUserIds || []
  );
  const { mutate: updateCommentAccess } = useUpdateCommentAccessMutation();

  const { data: eligibleUsers } = useGetUsersByFormation(formation);

  useEffect(() => {
    if (debouncedComment !== initialComment) {
      updateComment({ sessionId, nominationFileId, comment: debouncedComment || null });
    }
  }, [debouncedComment, initialComment, nominationFileId, updateComment, sessionId]);

  const handleAccessChange = (newSelectedUserIds: string[]) => {
    setSelectedAccessUserIds(newSelectedUserIds);
    updateCommentAccess({
      sessionId,
      nominationFileId,
      userIds: newSelectedUserIds
    });
  };

  return (
    <div>
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
    </div>
  );
};
