import { useCallback, useMemo, type ReactNode } from 'react';

import type { FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';

import { FeedbackStatusCommentModal } from './FeedbackStatusCommentModal';
import {
  FeedbackStatusCommentModalContext,
  type FeedbackStatusCommentEvent,
} from './FeedbackStatusCommentModalContext';

type FeedbackStatusCommentQuestion = { comment: string | null; status: FeedbackStatusEnum };

export function FeedbackStatusCommentModalProvider(props: { children: ReactNode }) {
  const { answer, ask, forget, state } = useAwaitableModal<
    FeedbackStatusCommentQuestion,
    FeedbackStatusCommentEvent
  >({ type: 'drop' });

  const waitForStatusComment = useCallback(
    (status: FeedbackStatusEnum, comment: string | null) => ask({ comment, status }),
    [ask],
  );

  const value = useMemo(() => ({ waitForStatusComment }), [waitForStatusComment]);

  return (
    <FeedbackStatusCommentModalContext value={value}>
      {state.status !== 'idle' && (
        <FeedbackStatusCommentModal
          comment={state.question.comment}
          key={state.id}
          onClosed={forget}
          onComment={(comment) => answer({ type: 'comment', value: comment })}
          onDrop={() => answer({ type: 'drop' })}
          open={state.status === 'asking'}
          status={state.question.status}
        />
      )}

      {props.children}
    </FeedbackStatusCommentModalContext>
  );
}
