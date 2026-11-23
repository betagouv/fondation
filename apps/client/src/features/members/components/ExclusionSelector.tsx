import Button from '@codegouvfr/react-dsfr/Button';
import { useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';
import { Modal } from '@/shared/ui/modal';

type Picker = (selection: { selected: readonly string[]; setSelected: (ids: string[]) => void }) => ReactNode;

function ExclusionSelectorModal(props: {
  onClose: () => void;
  onClosed: () => void;
  onSave: (ids: readonly string[]) => Promise<unknown>;
  open: boolean;
  originalIds: readonly string[];
  picker: Picker;
  title: ReactNode;
}) {
  const [isChanging, setIsChanging] = useState(false);
  const [selected, setSelected] = useState<readonly string[]>(props.originalIds);

  const original = new Set(props.originalIds);
  const isDirty = selected.length !== original.size || selected.some((id) => !original.has(id));

  const save = async () => {
    setIsChanging(true);
    try {
      await props.onSave(selected);
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
      title={props.title}
    >
      {props.picker({ selected, setSelected })}
    </Modal>
  );
}

/** the exclusions saved for a member, edited in a modal that saves them all at once */
export function ExclusionSelector(props: {
  editLabel: string;
  modalTitle: ReactNode;
  onSave: (ids: readonly string[]) => Promise<unknown>;
  originalIds: readonly string[];
  picker: Picker;
  saved: ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  return (
    <div className="flex items-start justify-end gap-x-2">
      {props.saved}
      <IconButton
        iconId="fr-icon-edit-fill"
        label={props.editLabel}
        onClick={() => {
          setOpenCount((current) => current + 1);
          setIsEditing(true);
        }}
        small
      />

      {openCount > 0 && (
        <div className="text-left">
          <ExclusionSelectorModal
            key={openCount}
            onClose={() => setIsEditing(false)}
            onClosed={() => !isEditing && setOpenCount(0)}
            onSave={props.onSave}
            open={isEditing}
            originalIds={props.originalIds}
            picker={props.picker}
            title={props.modalTitle}
          />
        </div>
      )}
    </div>
  );
}
