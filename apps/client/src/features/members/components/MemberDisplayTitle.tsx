import Button from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useCallback, useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';
import { useUpdateDisplayTitleMutation } from '@queries/members.queries';

export function MemberDisplayTitle(props: { member: { displayTitle: string | null; id: string } }) {
  const { formatMessage } = useIntl();
  const [isEditing, setEditing] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(props.member.displayTitle ?? '');
  const id = useId();

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
      setDisplayTitle(e.target.value);
    },
    [setDisplayTitle],
  );

  const {
    error,
    isPending: isUpdating,
    mutate: updateDisplayTitle,
  } = useUpdateDisplayTitleMutation({ userId: props.member.id });

  const toggleEdition = useCallback(
    (e: React.SubmitEvent | React.MouseEvent<HTMLButtonElement> | undefined) => {
      e?.preventDefault();

      if (!isEditing) {
        setEditing(true);
        return;
      }

      const newTitle = displayTitle.trim();
      const oldTitle = props.member.displayTitle;

      if (newTitle === oldTitle) {
        setEditing(false);
        return;
      }

      updateDisplayTitle(displayTitle.trim() || null, {
        onSuccess() {
          setEditing(false);
        },
      });
    },
    [isEditing, displayTitle, updateDisplayTitle, props],
  );

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Titre" />
        </dt>

        {isEditing ? (
          <div className="flex gap-1">
            <Button
              disabled={isUpdating}
              iconId="fr-icon-close-line"
              onClick={() => {
                setDisplayTitle(props.member.displayTitle ?? '');
                setEditing(false);
              }}
              priority="tertiary no outline"
              size="small"
              type="button"
            >
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
            <Button
              disabled={isUpdating || displayTitle.trim() === (props.member.displayTitle ?? '')}
              onClick={toggleEdition}
              priority="primary"
              size="small"
              type="button"
            >
              <FormattedMessage defaultMessage="Ok" />
            </Button>
          </div>
        ) : (
          <IconButton
            disabled={isUpdating}
            iconId="fr-icon-edit-fill"
            label={formatMessage({ defaultMessage: 'Éditer le titre' })}
            onClick={toggleEdition}
            small
          />
        )}
      </div>

      {isEditing ? (
        <form onSubmit={toggleEdition}>
          <Input
            hideLabel
            hintText={formatMessage({ defaultMessage: 'ex: M. le Président, Mme la ministre' })}
            label={formatMessage({ defaultMessage: 'Titre' })}
            nativeInputProps={{
              autoComplete: 'off',
              autoFocus: true,
              id,
              onChange: onTitleChange,
              placeholder: formatMessage({ defaultMessage: 'Saisissez un titre...' }),
              value: displayTitle,
            }}
            state={error ? 'error' : undefined}
            stateRelatedMessage={
              error ? formatMessage({ defaultMessage: 'Erreur à la mise à jour du titre' }) : undefined
            }
          />
        </form>
      ) : (
        <div
          className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)"
          id={id}
        >
          {displayTitle || (
            <span className="text-(--text-disabled-grey)">
              <FormattedMessage defaultMessage="Aucun titre" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
