import { createContext, useCallback, useContext } from 'react';

import type { NominationFileOutcomeEnum } from '@/types/enums.types';

import { nominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';

type OutcomeCommentCallbackEvent = { type: 'drop' } | { type: 'comment'; value: string | null };
export type OutcomeCommentCallback = (event: OutcomeCommentCallbackEvent) => unknown;

type OutcomeCommentDialogContextType = {
  commentCallback: OutcomeCommentCallback | null;
  initialComment: string | null;
  outcome: NominationFileOutcomeEnum | null;
  setCommentCallback: (callback: OutcomeCommentCallback) => void;
  setInitialComment: (value: string | null) => void;
  setOutcome: (value: NominationFileOutcomeEnum) => void;
};

/** @internal */
export const OutcomeCommentModalContext = createContext<OutcomeCommentDialogContextType>(
  null as unknown as OutcomeCommentDialogContextType,
);

export function useOutcomeCommentDialog() {
  const { setCommentCallback, setInitialComment, setOutcome } = useContext(OutcomeCommentModalContext);

  const waitForOutcomeComment = useCallback(
    (
      outcome: NominationFileOutcomeEnum,
      initialComment: string | null = null,
    ): Promise<OutcomeCommentCallbackEvent> => {
      setOutcome(outcome);
      setInitialComment(initialComment);
      return new Promise((resolve) => {
        setCommentCallback(() => resolve);

        nominationFileOutcomeCommentModal.open();
      });
    },
    [setCommentCallback, setInitialComment, setOutcome],
  );

  return { waitForOutcomeComment };
}
