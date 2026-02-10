import { Input } from '@codegouvfr/react-dsfr/Input';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useUpdateNominationFileCommentMutation } from '@queries/members.queries';

export type MagistratCommentEditProps = {
  nominationFileId: string;
  sessionId: string;
  initialComment?: string | null;
};

export function MagistratCommentEdit(props: {
  id: string;
  sessionId: string;
  nominationFileId: string;
  initialComment?: string | null;
}) {
  const { id, sessionId, nominationFileId, initialComment } = props;
  const [comment, setComment] = useState(initialComment || '');
  const [debouncedComment] = useDebounce(comment, 400);

  const { mutate: updateComment } = useUpdateNominationFileCommentMutation();
  useEffect(() => {
    updateComment({ sessionId, nominationFileId, comment: debouncedComment || null });
  }, [debouncedComment, initialComment, nominationFileId, updateComment, sessionId]);

  return (
    <div>
      <Input
        id={id}
        label=""
        textArea
        nativeTextAreaProps={{
          rows: 6,
          value: comment,
          onChange: (e) => setComment(e.target.value),
          placeholder: 'Saisissez un commentaire...'
        }}
      />
    </div>
  );
}
