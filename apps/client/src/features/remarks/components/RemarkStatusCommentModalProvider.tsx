import { useCallback, useMemo, type ReactNode } from 'react';

import type { RemarkStatusEnum } from '@/shared/enums/remark-status.enum';
import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';

import { RemarkStatusCommentModal } from './RemarkStatusCommentModal';
import {
  RemarkStatusCommentModalContext,
  type RemarkStatusCommentEvent,
} from './RemarkStatusCommentModalContext';

type RemarkStatusCommentQuestion = { comment: string | null; status: RemarkStatusEnum };

export function RemarkStatusCommentModalProvider(props: { children: ReactNode }) {
  const { answer, ask, forget, state } = useAwaitableModal<
    RemarkStatusCommentQuestion,
    RemarkStatusCommentEvent
  >({ type: 'drop' });

  const waitForStatusComment = useCallback(
    (status: RemarkStatusEnum, comment: string | null) => ask({ comment, status }),
    [ask],
  );

  const value = useMemo(() => ({ waitForStatusComment }), [waitForStatusComment]);

  return (
    <RemarkStatusCommentModalContext value={value}>
      {state.status !== 'idle' && (
        <RemarkStatusCommentModal
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
    </RemarkStatusCommentModalContext>
  );
}
