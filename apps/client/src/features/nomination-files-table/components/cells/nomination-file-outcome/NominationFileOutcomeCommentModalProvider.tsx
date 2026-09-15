import { useCallback, useMemo, type ReactNode } from 'react';

import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';

import { NominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';
import { OutcomeCommentModalContext, type OutcomeCommentEvent } from './OutcomeCommentModalContext';

type OutcomeCommentQuestion = { initialComment: string | null; outcome: NominationFileOutcomeEnum };

export function NominationFileOutcomeCommentModalProvider(props: { children: ReactNode }) {
  const { answer, ask, forget, state } = useAwaitableModal<OutcomeCommentQuestion, OutcomeCommentEvent>({
    type: 'drop',
  });

  const waitForOutcomeComment = useCallback(
    (outcome: NominationFileOutcomeEnum, initialComment: string | null = null) =>
      ask({ initialComment, outcome }),
    [ask],
  );

  const value = useMemo(() => ({ waitForOutcomeComment }), [waitForOutcomeComment]);

  return (
    <OutcomeCommentModalContext value={value}>
      {state.status !== 'idle' && (
        <NominationFileOutcomeCommentModal
          initialComment={state.question.initialComment}
          key={state.id}
          onClosed={forget}
          onComment={(value) => answer({ type: 'comment', value })}
          onDrop={() => answer({ type: 'drop' })}
          open={state.status === 'asking'}
          outcome={state.question.outcome}
        />
      )}

      {props.children}
    </OutcomeCommentModalContext>
  );
}
