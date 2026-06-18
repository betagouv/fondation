import React from 'react';

import { observationFollowUpCommentModal } from '@/features/observations/components/ObservationFollowUpCommentDialog';
import {
  ObservationFollowUpCommentContext,
  type ObservationFollowUpCommentEvent,
} from '@/features/observations/context/ObservationFollowUpCommentContext';
import type { ObservationFollowupEnum } from '@/types/enums.types';

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
