import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';
import { Modal } from '@/shared/ui/modal';

import { MagistratAutocomplete, type ExcludedMagistrat } from './MagistratAutocomplete';

function ExcludedMagistratList(props: { excluded: readonly ExcludedMagistrat[] }) {
  if (props.excluded.length === 0) return <span className="font-bold text-(--text-disabled-grey)">n/a</span>;

  return (
    <ul className="fr-p-0 fr-m-0 flex list-none flex-col items-end gap-1 text-right">
      {props.excluded.map(({ gradeAndJurisdiction, id, name }) => (
        <li className="fr-p-0" key={id}>
          {name}
          {gradeAndJurisdiction && (
            <span className="text-(--text-mention-grey)"> · {gradeAndJurisdiction}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function MagistratSelectorModal(props: {
  excluded: readonly ExcludedMagistrat[];
  onChange: (magistratIds: readonly string[]) => Promise<unknown>;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const originalIds = props.excluded.map(({ id }) => id);
  const [isChanging, setIsChanging] = useState(false);
  const [selected, setSelected] = useState(originalIds);

  const isDirty = selected.length !== originalIds.length || selected.some((id) => !originalIds.includes(id));

  const save = async () => {
    setIsChanging(true);
    try {
      await props.onChange(selected);
      props.onClose();
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Modal
      actions={
        <>
          <Button disabled={isChanging} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={!isDirty || isChanging} onClick={save}>
            {isChanging ? (
              <FormattedMessage defaultMessage="Sauvegarde..." />
            ) : (
              <FormattedMessage defaultMessage="Sauvegarder" />
            )}
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={<FormattedMessage defaultMessage="Sélection des magistrats" />}
    >
      <MagistratAutocomplete excluded={props.excluded} onChange={setSelected} selected={selected} />
    </Modal>
  );
}

export function MagistratSelector(props: {
  excluded: readonly ExcludedMagistrat[];
  onChange: (magistratIds: readonly string[]) => Promise<unknown>;
}) {
  const { formatMessage } = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  return (
    <div className="flex items-start justify-end gap-x-2">
      <ExcludedMagistratList excluded={props.excluded} />
      <IconButton
        iconId="fr-icon-edit-fill"
        label={formatMessage({ defaultMessage: 'Éditer les magistrats exclus' })}
        onClick={() => {
          setOpenCount((current) => current + 1);
          setIsEditing(true);
        }}
        small
      />

      {openCount > 0 && (
        <div className="text-left">
          <MagistratSelectorModal
            excluded={props.excluded}
            key={openCount}
            onChange={props.onChange}
            onClose={() => setIsEditing(false)}
            onClosed={() => !isEditing && setOpenCount(0)}
            open={isEditing}
          />
        </div>
      )}
    </div>
  );
}
