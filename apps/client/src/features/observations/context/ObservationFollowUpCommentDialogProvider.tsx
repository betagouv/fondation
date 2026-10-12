import { useMemo, type PropsWithChildren } from 'react';

import { ObservationFollowUpCommentModal } from '@/features/observations/components/ObservationFollowUpCommentDialog';
import type { ObservationFollowUpEnum } from '@/shared/enums/observation-follow-up.enum';
import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';

import {
  ObservationFollowUpCommentContext,
  type ObservationFollowUpCommentEvent,
} from './ObservationFollowUpCommentContext';

export function ObservationFollowUpCommentProvider({ children }: PropsWithChildren) {
  const { answer, ask, forget, state } = useAwaitableModal<
    ObservationFollowUpEnum,
    ObservationFollowUpCommentEvent
  >({ type: 'drop' });

  const value = useMemo(() => ({ waitForComment: ask }), [ask]);

  return (
    <ObservationFollowUpCommentContext value={value}>
      {state.status !== 'idle' && (
        <ObservationFollowUpCommentModal
          followUp={state.question}
          key={state.id}
          onClosed={forget}
          onComment={(value) => answer({ type: 'comment', value })}
          onDrop={() => answer({ type: 'drop' })}
          open={state.status === 'asking'}
        />
      )}

      {children}
    </ObservationFollowUpCommentContext>
  );
}
