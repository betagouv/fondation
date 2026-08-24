import { createContext, useContext } from 'react';

import type { NominationFileOutcomeEnum } from '@/types/enums.types';

export type OutcomeCommentEvent = { type: 'drop' } | { type: 'comment'; value: string | null };

type OutcomeCommentDialogContextType = {
  waitForOutcomeComment: (
    outcome: NominationFileOutcomeEnum,
    initialComment?: string | null,
  ) => Promise<OutcomeCommentEvent>;
};

/** @internal */
export const OutcomeCommentModalContext = createContext<OutcomeCommentDialogContextType | null>(null);

export function useOutcomeCommentDialog() {
  const context = useContext(OutcomeCommentModalContext);
  if (!context)
    throw new Error('useOutcomeCommentDialog must be used within NominationFileOutcomeCommentModalProvider');

  return context;
}
