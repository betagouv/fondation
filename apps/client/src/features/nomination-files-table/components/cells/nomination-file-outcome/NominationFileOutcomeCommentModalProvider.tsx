import { useCallback, useMemo, type ReactNode } from 'react';

import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';

import { NominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';
import {
  OutcomeCommentModalContext,
  type CurrentOutcome,
  type OutcomeCommentEvent,
} from './OutcomeCommentModalContext';

type OutcomeCommentQuestion = { current: CurrentOutcome; outcome: NominationFileOutcomeEnum };

export function NominationFileOutcomeCommentModalProvider(props: { children: ReactNode }) {
  const { answer, ask, forget, state } = useAwaitableModal<OutcomeCommentQuestion, OutcomeCommentEvent>({
    type: 'drop',
  });

  const waitForOutcomeComment = useCallback(
    (outcome: NominationFileOutcomeEnum, current: CurrentOutcome) => ask({ current, outcome }),
    [ask],
  );

  const value = useMemo(() => ({ waitForOutcomeComment }), [waitForOutcomeComment]);

  return (
    <OutcomeCommentModalContext value={value}>
      {state.status !== 'idle' && (
        <NominationFileOutcomeCommentModal
          current={state.question.current}
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
