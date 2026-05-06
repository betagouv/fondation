import React from 'react';

import type { NominationFileOutcomeEnum } from '@/types/enums.types';

import { nominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';

type OutcomeCommentCallbackEvent = { type: 'drop' } | { type: 'comment'; value: string | null };
export type OutcomeCommentCallback = (event: OutcomeCommentCallbackEvent) => unknown;

type OutcomeCommentDialogContextType = {
  outcome: NominationFileOutcomeEnum | null;
  setOutcome: (value: NominationFileOutcomeEnum) => void;

  commentCallback: OutcomeCommentCallback | null;
  setCommentCallback: (callback: OutcomeCommentCallback) => void;
};

/** @internal */
export const OutcomeCommentModalContext = React.createContext<OutcomeCommentDialogContextType>(
  null as unknown as OutcomeCommentDialogContextType,
);

export function useOutcomeCommentDialog() {
  const { setOutcome, setCommentCallback } = React.useContext(OutcomeCommentModalContext);

  const waitForOutcomeComment = React.useCallback(
    (outcome: NominationFileOutcomeEnum): Promise<OutcomeCommentCallbackEvent> => {
      setOutcome(outcome);
      return new Promise((resolve) => {
        setCommentCallback(() => resolve);

        nominationFileOutcomeCommentModal.open();
      });
    },
    [setOutcome, setCommentCallback],
  );

  return { waitForOutcomeComment };
}
