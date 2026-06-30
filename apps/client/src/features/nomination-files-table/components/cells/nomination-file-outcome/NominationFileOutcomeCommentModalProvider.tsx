import { useCallback, useState, type ReactNode } from 'react';

import type { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';

import { NominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';
import { OutcomeCommentModalContext, type OutcomeCommentCallback } from './OutcomeCommentModalContext';

export function NominationFileOutcomeCommentModalProvider(props: {
  children: ReactNode;
  formation: FormationEnum;
}) {
  const [outcome, setOutcome] = useState<NominationFileOutcomeEnum | null>(null);
  const [initialComment, setInitialComment] = useState<string | null>(null);
  const [commentCallback, setCommentCallback] = useState<OutcomeCommentCallback | null>(null);

  const reset = useCallback(() => {
    setOutcome(null);
    setInitialComment(null);
    setCommentCallback(null);
  }, [setCommentCallback, setInitialComment, setOutcome]);

  const onCommentChange = useCallback(
    (comment: string | null) => {
      commentCallback?.({ type: 'comment', value: comment });
      reset();
    },
    [commentCallback, reset],
  );

  const onDrop = useCallback(() => {
    commentCallback?.({ type: 'drop' });
    reset();
  }, [commentCallback, reset]);

  return (
    <OutcomeCommentModalContext
      value={{
        commentCallback,
        initialComment,
        outcome,
        setCommentCallback,
        setInitialComment,
        setOutcome,
      }}
    >
      <NominationFileOutcomeCommentModal
        formation={props.formation}
        onChange={onCommentChange}
        onDrop={onDrop}
      />

      {props.children}
    </OutcomeCommentModalContext>
  );
}
