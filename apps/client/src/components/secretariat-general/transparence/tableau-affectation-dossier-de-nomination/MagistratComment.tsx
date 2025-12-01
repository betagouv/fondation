import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Magistrat, Role } from 'shared-models';
import { useValidateSessionFromCookie } from '../../../../react-query/queries/validate-session-from-cookie.query';
import { MagistratCommentEdit } from './MagistratCommentEdit';
import { MagistratCommentView } from './MagistratCommentView';

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

  const showComment = isSG || initialComment !== null;

  if (!showComment) {
    return null;
  }

  if (isSG && sessionId) {
    return (
      <MagistratCommentEdit
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
