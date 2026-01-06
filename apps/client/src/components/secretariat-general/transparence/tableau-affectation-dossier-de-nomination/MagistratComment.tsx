import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { useUser } from '@queries/auth.queries';

import type { FormationEnum } from '@/types/enums.types';
import { MagistratCommentEdit } from './MagistratCommentEdit';
import { MagistratCommentView } from './MagistratCommentView';

export type MagistratCommentProps = {
  nominationFileId: string;
  initialComment?: string | null;
  initialCommentAccessUserIds?: string[];
  formation: FormationEnum;
};

export const MagistratComment: FC<MagistratCommentProps> = ({
  nominationFileId,
  initialComment,
  initialCommentAccessUserIds,
  formation
}) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useUser();
  const isSG = user?.role === 'ADJOINT_SECRETAIRE_GENERAL';

  const showComment = isSG || initialComment !== null;

  if (!showComment) {
    return null;
  }

  if (isSG && sessionId) {
    return (
      <MagistratCommentEdit
        key={
          // to unmount the component
          `magistrat-comment-edit-${sessionId}-${nominationFileId}-${formation}`
        }
        nominationFileId={nominationFileId}
        sessionId={sessionId}
        initialComment={initialComment}
        initialCommentAccessUserIds={initialCommentAccessUserIds}
        formation={formation}
      />
    );
  }

  return <MagistratCommentView initialComment={initialComment} />;
};
