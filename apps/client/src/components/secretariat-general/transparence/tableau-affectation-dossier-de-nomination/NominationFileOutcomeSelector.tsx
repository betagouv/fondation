import { DropdownSelect } from '@/components/shared/DropdownSelect';
import type { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';
import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useDefineNominationFileOutcomeMutation } from '@queries/nomination-sessions.queries';
import React, { useMemo } from 'react';
import { NominationFileOutcomeBadge, NominationFileOutcomeShortBadge } from './NominationFileOutcomeBadge';

const nominationFileOutcomeCommentModal = createModal({
  id: 'nominationFileOutcomeCommentModal',
  isOpenedByDefault: false
});

function NominationFileOutcomeCommentModal(props: {
  outcome: NominationFileOutcomeEnum | '@@EMPTY';
  formation: FormationEnum;
  onChange: (comment: string | null) => unknown;
  onDrop: () => unknown;
}) {
  const [hasError, setError] = React.useState(false);
  const [comment, setComment] = React.useState<string | null>(null);
  const [closedByUser, setClosedByUser] = React.useState(true);
  const isCommentRequired = React.useMemo(() => props.outcome === 'NON_VALIDATED', [props.outcome]);

  const isCommentValid = (comment?.trim().length ?? 0) > 0;
  const hint =
    props.formation === 'PARQUET'
      ? `Les avis défavorables nécessitent un commentaire`
      : `Les avis non conformes nécessitent un commentaire`;

  useIsModalOpen(nominationFileOutcomeCommentModal, {
    onConceal() {
      if (closedByUser) props.onDrop();

      setError(false);
      setComment(null);
      setClosedByUser(true);
    }
  });

  const onCancelClick = React.useCallback(() => {
    if (isCommentRequired) return;

    props.onChange(null);
    setClosedByUser(false);
    nominationFileOutcomeCommentModal.close();
  }, [props, isCommentRequired]);

  const onConfirmClick = React.useCallback(() => {
    if (isCommentRequired && !isCommentValid) {
      setError(true);
      return;
    }

    props.onChange(comment?.trim() || null);
    setClosedByUser(false);
    nominationFileOutcomeCommentModal.close();
    setComment(null);
  }, [props, comment, isCommentRequired, isCommentValid]);

  return (
    <nominationFileOutcomeCommentModal.Component
      title="Commentaire"
      concealingBackdrop={!isCommentRequired}
      topAnchor
      buttons={[
        {
          doClosesModal: false,
          priority: 'secondary',
          children: 'Sans commentaire',
          onClick: onCancelClick,
          disabled: isCommentRequired,
          title: isCommentRequired ? hint : undefined
        },
        {
          doClosesModal: false,
          priority: 'primary',
          children: 'Sauvegarder',
          onClick: onConfirmClick,
          disabled: isCommentRequired && !isCommentValid
        }
      ]}
    >
      <form>
        <Input
          textArea
          label={
            isCommentRequired ? (
              <>
                commentaire<span className="text-red-500">*</span>
              </>
            ) : (
              'commentaire'
            )
          }
          hintText={hasError ? <span className="text-red-600">{hint}</span> : undefined}
          nativeTextAreaProps={{
            value: comment || '',
            required: isCommentRequired,
            onChange: (event) => {
              setComment(event.target.value || null);

              if (hasError) setError(false);
            }
          }}
        />
      </form>
    </nominationFileOutcomeCommentModal.Component>
  );
}

const NOMINATION_FILE_OUTCOME_OPTIONS = [
  '@@EMPTY',
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN'
] as const satisfies ('@@EMPTY' | NominationFileOutcomeEnum)[];

export function NominationFileOutcomeSelector(props: {
  sessionId: string;
  nominationFileId: string;
  formation: FormationEnum;
  value: NominationFileOutcomeEnum | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_comment, setComment] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<NominationFileOutcomeEnum | '@@EMPTY'>(
    props.value ?? ('@@EMPTY' as const)
  );

  const { mutate, isPending } = useDefineNominationFileOutcomeMutation({
    sessionId: props.sessionId,
    nominationFileId: props.nominationFileId
  });

  const onChange = React.useCallback(
    (changedOutcome: { value: NominationFileOutcomeEnum | null; comment: string | null }) => {
      mutate(
        changedOutcome.value
          ? { outcome: changedOutcome.value, comment: changedOutcome.comment }
          : { outcome: null, comment: null },
        {
          onError(error) {
            console.error(error);
            setOutcome(props.value || '@@EMPTY');
          }
        }
      );
    },
    [mutate, setOutcome, props]
  );

  const options = useMemo(
    () =>
      NOMINATION_FILE_OUTCOME_OPTIONS.map((value) =>
        value === '@@EMPTY'
          ? { value, label: <span className="text-xs">SANS ISSUE</span> }
          : {
              value,
              label: (
                <NominationFileOutcomeBadge
                  formation={props.formation}
                  outcome={value}
                  key={`outcome_option_${value}`}
                />
              ),
              selected: (
                <NominationFileOutcomeShortBadge
                  formation={props.formation}
                  outcome={value}
                  key={`short_outcome_option_${value}`}
                />
              )
            }
      ),
    [props.formation]
  );

  return (
    <>
      <DropdownSelect
        options={options}
        placeholder="SANS ISSUE"
        disabled={isPending}
        value={outcome}
        onChange={(value) => {
          if (value === '@@EMPTY' || !value) {
            setOutcome('@@EMPTY');
            onChange({ value: null, comment: null });
            return;
          }

          setOutcome(value);
          nominationFileOutcomeCommentModal.open();
        }}
      />

      <NominationFileOutcomeCommentModal
        outcome={outcome}
        formation={props.formation}
        onChange={(comment) => {
          if (outcome !== '@@EMPTY') {
            setComment(comment);
            onChange({ comment, value: outcome });
          }

          nominationFileOutcomeCommentModal.close();
        }}
        onDrop={() => {
          setComment(null);
          setOutcome(props.value ?? '@@EMPTY');
        }}
      />
    </>
  );
}
