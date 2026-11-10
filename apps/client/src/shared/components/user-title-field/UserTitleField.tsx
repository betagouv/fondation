import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState, type SyntheticEvent } from 'react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';

const TITLES = {
  displayTitle: {
    edit: defineMessage({ defaultMessage: 'Éditer le titre affiché' }),
    error: defineMessage({ defaultMessage: 'Erreur à la mise à jour du titre affiché' }),
    hint: defineMessage({ defaultMessage: 'ex: M. le Président, Mme la ministre' }),
    label: defineMessage({ defaultMessage: 'Titre affiché' }),
  },
  recusalTitle: {
    edit: defineMessage({ defaultMessage: 'Éditer le titre déport' }),
    error: defineMessage({ defaultMessage: 'Erreur à la mise à jour du titre déport' }),
    hint: defineMessage({
      defaultMessage:
        'Avec son article, ex : le Bâtonnier, la Première présidente. Le PV mentionne alors le déport de « M. le Bâtonnier FORGET ».',
    }),
    label: defineMessage({ defaultMessage: 'Titre déport' }),
  },
};

export function UserTitleField(props: {
  kind: keyof typeof TITLES;
  saved: string | null;
  update: {
    error: unknown;
    isPending: boolean;
    mutate: (title: string | null, options: { onSuccess: () => void }) => void;
  };
}) {
  const { formatMessage } = useIntl();
  const field = TITLES[props.kind];
  const { error, isPending, mutate } = props.update;
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(props.saved ?? '');

  const handleEdit = () => {
    setTitle(props.saved ?? '');
    setEditing(true);
  };

  const newTitle = title.trim() || null;
  const isUnchanged = newTitle === props.saved;

  const handleSave = (e: SyntheticEvent) => {
    e.preventDefault();
    if (isUnchanged) setEditing(false);
    else mutate(newTitle, { onSuccess: () => setEditing(false) });
  };

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
        <dt className="font-bold">
          <FormattedMessage {...field.label} />
        </dt>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              disabled={isPending}
              iconId="fr-icon-close-line"
              onClick={() => setEditing(false)}
              priority="tertiary no outline"
              size="small"
              type="button"
            >
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
            <Button
              disabled={isPending || isUnchanged}
              onClick={handleSave}
              priority="primary"
              size="small"
              type="button"
            >
              <FormattedMessage defaultMessage="Ok" />
            </Button>
          </div>
        ) : (
          <IconButton
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            label={formatMessage(field.edit)}
            onClick={handleEdit}
            small
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hintText={formatMessage(field.hint)}
            label={<span className="fr-sr-only">{formatMessage(field.label)}</span>}
            nativeInputProps={{
              autoComplete: 'off',
              autoFocus: true,
              onChange: (e) => setTitle(e.target.value),
              placeholder: formatMessage({ defaultMessage: 'Saisissez un titre...' }),
              value: title,
            }}
            state={error ? 'error' : undefined}
            stateRelatedMessage={error ? formatMessage(field.error) : undefined}
          />
        </form>
      ) : (
        <div className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          {props.saved || (
            <span className="text-(--text-disabled-grey)">
              <FormattedMessage defaultMessage="Aucun titre" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
