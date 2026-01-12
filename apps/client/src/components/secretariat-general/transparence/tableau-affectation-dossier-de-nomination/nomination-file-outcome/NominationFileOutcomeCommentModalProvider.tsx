import React from 'react';
import { OutcomeCommentModalContext, type OutcomeCommentCallback } from './OutcomeCommentModalContext';
import type { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';
import { NominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';

export function NominationFileOutcomeCommentModalProvider(props: {
  formation: FormationEnum;
  children: React.ReactNode;
}) {
  const [outcome, setOutcome] = React.useState<NominationFileOutcomeEnum | null>(null);
  const [commentCallback, setCommentCallback] = React.useState<OutcomeCommentCallback | null>(null);

  const reset = React.useCallback(() => {
    setOutcome(null);
    setCommentCallback(null);
  }, [setOutcome, setCommentCallback]);

  const onCommentChange = React.useCallback(
    (comment: string | null) => {
      commentCallback?.({ type: 'comment', value: comment });
      reset();
    },
    [commentCallback, reset]
  );

  const onDrop = React.useCallback(() => {
    commentCallback?.({ type: 'drop' });
    reset();
  }, [commentCallback, reset]);

  return (
    <OutcomeCommentModalContext value={{ outcome, setOutcome, commentCallback, setCommentCallback }}>
      <NominationFileOutcomeCommentModal
        onDrop={onDrop}
        onChange={onCommentChange}
        formation={props.formation}
      />

      {props.children}
    </OutcomeCommentModalContext>
  );
}
