import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useToasts } from '@/shared/ui/toast';
import { useSessionCommentQuery, useWriteSessionCommentMutation } from '@queries/nomination-sessions.queries';

export type SessionCommentDraft = {
  cancel: () => void;
  isDirty: boolean;
  isError: boolean;
  isPending: boolean;
  isWarned: boolean;
  onChange: (value: string) => void;
  save: () => Promise<void>;
  /** false, and warns about the unsaved changes, when leaving would lose them */
  tryLeave: () => boolean;
  value: string;
};

export function useSessionCommentDraft(props: { sessionId: string }): SessionCommentDraft {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { data } = useSessionCommentQuery({ sessionId: props.sessionId });
  const { isError, isPending, mutateAsync } = useWriteSessionCommentMutation({ sessionId: props.sessionId });
  const [draft, setDraft] = useState<string | null>(null);
  const [isWarned, setWarned] = useState(false);

  function reset() {
    setDraft(null);
    setWarned(false);
  }

  return {
    cancel: reset,
    isDirty: draft !== null,
    isError,
    isPending,
    isWarned: isWarned && draft !== null,
    onChange: setDraft,
    save: async () => {
      await mutateAsync({ comment: draft ?? '' });
      reset();
      toasts.success({ title: formatMessage({ defaultMessage: 'Commentaire enregistré' }) });
    },
    tryLeave: () => {
      if (draft === null) return true;
      setWarned(true);
      return false;
    },
    value: draft ?? data?.comment ?? '',
  };
}
