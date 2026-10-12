import { createContext, useContext } from 'react';

import type { ObservationFollowUpEnum } from '@/shared/enums/observation-follow-up.enum';

export type ObservationFollowUpCommentEvent = { type: 'drop' } | { type: 'comment'; value: string | null };

type ObservationFollowUpCommentContextType = {
  waitForComment: (followUp: ObservationFollowUpEnum) => Promise<ObservationFollowUpCommentEvent>;
};

/** @internal */
export const ObservationFollowUpCommentContext = createContext<ObservationFollowUpCommentContextType | null>(
  null,
);

export function useObservationFollowUpCommentDialog() {
  const context = useContext(ObservationFollowUpCommentContext);
  if (!context)
    throw new Error(
      'useObservationFollowUpCommentDialog must be used within ObservationFollowUpCommentProvider',
    );

  return context;
}
