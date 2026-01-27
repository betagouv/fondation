import React from 'react';

import type { ObservationFollowupEnum } from '@/types/enums.types';
import {
  ObservationFollowUpCommentContext,
  type ObservationFollowUpCommentEvent
} from './ObservationFollowUpCommentContext';
import { observationFollowUpModal } from './ObservationFollowUpCommentDialog';

export function useObservationFollowUpCommentDialog() {
  const ctx = React.useContext(ObservationFollowUpCommentContext);

  if (!ctx) throw new Error('Unknown "ObservationFollowUpCommentContext"');

  const waitForComment = React.useCallback(
    (followUp: ObservationFollowupEnum) => {
      ctx.setFollowUp(followUp);

      return new Promise<ObservationFollowUpCommentEvent>((resolve) => {
        ctx.setCallback(() => resolve);
        observationFollowUpModal.open();
      });
    },
    [ctx]
  );

  return { waitForComment };
}
