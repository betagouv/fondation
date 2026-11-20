import { createContext, useContext } from 'react';

import type { FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';

export type FeedbackStatusCommentEvent = { type: 'drop' } | { type: 'comment'; value: string | null };

type FeedbackStatusCommentModalContextType = {
  waitForStatusComment: (
    status: FeedbackStatusEnum,
    comment: string | null,
  ) => Promise<FeedbackStatusCommentEvent>;
};

/** @internal */
export const FeedbackStatusCommentModalContext = createContext<FeedbackStatusCommentModalContextType | null>(
  null,
);

export function useFeedbackStatusCommentModal() {
  const context = useContext(FeedbackStatusCommentModalContext);
  if (!context)
    throw new Error('useFeedbackStatusCommentModal must be used within FeedbackStatusCommentModalProvider');

  return context;
}
