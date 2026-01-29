import type { ObservationFollowupEnum } from '@/types/enums.types';
import React from 'react';

export type ObservationFollowUpCommentEvent = { type: 'drop' } | { type: 'comment'; value: string | null };
export type ObservationFollowUpCommentCallback = (event: ObservationFollowUpCommentEvent) => void;

type ObservationFollowUpCommentContextType = {
  followUp: ObservationFollowupEnum | null;
  setFollowUp: (value: ObservationFollowupEnum) => void;

  callback: ObservationFollowUpCommentCallback | null;
  setCallback: (factory: () => ObservationFollowUpCommentCallback) => void;
};

export const ObservationFollowUpCommentContext = React.createContext(
  null as unknown as ObservationFollowUpCommentContextType
);
