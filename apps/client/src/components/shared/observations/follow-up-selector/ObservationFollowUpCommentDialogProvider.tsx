import React from 'react';

import type { ObservationFollowupEnum } from '@/types/enums.types';

import { ObservationFollowUpCommentModal } from './ObservationFollowUpCommentDialog';
import {
  ObservationFollowUpCommentContext,
  type ObservationFollowUpCommentCallback
} from './ObservationFollowUpCommentContext';

export function ObservationFollowUpCommentProvider(props: React.PropsWithChildren) {
  const [followUp, setFollowUp] = React.useState<ObservationFollowupEnum | null>(null);
  const [callback, setCallback] = React.useState<ObservationFollowUpCommentCallback | null>(null);

  const onDrop = React.useCallback(() => callback?.({ type: 'drop' }), [callback]);
  const onChange = React.useCallback(
    (value: string | null) => callback?.({ type: 'comment', value }),
    [callback]
  );

  return (
    <ObservationFollowUpCommentContext value={{ followUp, setFollowUp, callback, setCallback }}>
      <ObservationFollowUpCommentModal followUp={followUp} onChange={onChange} onDrop={onDrop} />
      {props.children}
    </ObservationFollowUpCommentContext>
  );
}
