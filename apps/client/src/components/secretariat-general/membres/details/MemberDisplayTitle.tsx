import Button from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useCallback, useId, useState } from 'react';

import { useUpdateDisplayTitleMutation } from '@queries/members.queries';

export function MemberDisplayTitle(props: { member: { id: string; displayTitle: string | null } }) {
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
    mutate: updateDisplayTitle,
    isPending: isUpdating,
    error,
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
        <dt className="font-bold">Titre</dt>

        {isEditing ? (
          <Button
            size="small"
            disabled={isUpdating}
            onClick={toggleEdition}
            title="Sauvegarder le titre"
            priority="primary"
            iconId="ri-check-line"
          >
            Ok
          </Button>
        ) : (
          <Button
            onClick={toggleEdition}
            disabled={isUpdating}
            title="Éditer le titre"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>

      {isEditing ? (
        <form onSubmit={toggleEdition}>
          <Input
            label="Titre"
            hideLabel
            hintText="ex: M. le Président, Mme la ministre"
            state={error ? 'error' : undefined}
            stateRelatedMessage={error ? `Erreur à la mise à jour du titre` : undefined}
            nativeInputProps={{
              id,
              autoFocus: true,
              autoComplete: 'off',
              value: displayTitle,
              onChange: onTitleChange,
              placeholder: 'Saisissez un titre...',
            }}
          />
        </form>
      ) : (
        <div id={id} className="fr-mt-2v fr-p-4v rounded-sm border border-gray-300 bg-gray-50">
          {displayTitle || <span className="text-gray-400">Aucun titre</span>}
        </div>
      )}
    </div>
  );
}
