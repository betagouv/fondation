import React from 'react';

import type { ObservationFollowupEnum } from '@/types/enums.types';

import {
  ObservationFollowUpCommentContext,
  type ObservationFollowUpCommentEvent,
} from './ObservationFollowUpCommentContext';
import { observationFollowUpCommentModal } from './ObservationFollowUpCommentDialog';

export function useObservationFollowUpCommentDialog() {
  const ctx = React.useContext(ObservationFollowUpCommentContext);

  if (!ctx) throw new Error('Unknown "ObservationFollowUpCommentContext"');

  const waitForComment = React.useCallback(
    (followUp: ObservationFollowupEnum) => {
      ctx.setFollowUp(followUp);

      return new Promise<ObservationFollowUpCommentEvent>((resolve) => {
        ctx.setCallback(() => resolve);
        observationFollowUpCommentModal.open();
      });
    },
    [ctx],
  );

  return { waitForComment };
}
