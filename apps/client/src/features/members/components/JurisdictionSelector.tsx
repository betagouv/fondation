import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { Tooltip } from '@/shared/ui/tooltip';

import { JuridictionAutocomplete } from './JurisdictionAutocomplete';

function JurisdictionSelectorSelected(props: { selected: readonly { id: string; label: string | null }[] }) {
  if (props.selected.length === 0) return <span className="font-bold text-(--text-disabled-grey)">n/a</span>;

  return (
    <>
      <ul className="fr-p-0 flex list-none flex-row flex-wrap items-center gap-x-2">
        {props.selected.slice(0, 4).map(({ id, label }) => (
          <li className="shrink-0 grow-0" key={`jurisdiction_${id}`}>
            <Tag>{label ?? id}</Tag>
          </li>
        ))}
        {props.selected.length > 4 ? (
          <li className="shrink-0 whitespace-nowrap">
            <Tooltip
              className="shrink-0"
              label={
                <ul>
                  {props.selected.map(({ label, id }) => (
                    <li key={`excluded_jurisdictions_tooltip_${id}`}>{label ?? id}</li>
                  ))}
                </ul>
              }
            >
              <Tag
                nativeButtonProps={{
                  className: 'shrink-0 cursor-help whitespace-nowrap',
                }}
                small
              >
                {`(+${props.selected.length - 4})`}
              </Tag>
            </Tooltip>
          </li>
        ) : null}
      </ul>
    </>
  );
}

function JurisdictionSelectorModal(props: {
  onChange?: (selected: readonly string[]) => Promise<unknown>;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  selected: readonly { id: string; label: string | null }[];
}) {
  const originalIds = props.selected.map(({ id }) => id);
  const [isChanging, setIsChanging] = useState(false);
  const [selected, setSelected] = useState<string[]>(originalIds);

  const isDirty = selected.length !== originalIds.length || selected.some((id) => !originalIds.includes(id));

  const save = async () => {
    setIsChanging(true);
    try {
      await props.onChange?.(selected);
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
      title={<FormattedMessage defaultMessage="Sélection des juridictions" />}
    >
      <JuridictionAutocomplete onChange={setSelected} selected={props.selected} />
    </Modal>
  );
}

export function JurisdictionSelector(props: {
  selected?: readonly { id: string; label: string | null }[];
  onChange?: (selected: readonly string[]) => Promise<unknown>;
}) {
  const { formatMessage } = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const selected = props.selected ?? [];

  return (
    <div className="flex items-center gap-x-2">
      <JurisdictionSelectorSelected selected={selected} />
      <Button
        className="rounded-full"
        iconId="fr-icon-edit-fill"
        onClick={() => {
          setOpenCount((current) => current + 1);
          setIsEditing(true);
        }}
        priority="tertiary no outline"
        size="small"
        title={formatMessage({ defaultMessage: 'Éditer les juridictions exclues' })}
      />

      {openCount > 0 && (
        <div className="text-left">
          <JurisdictionSelectorModal
            key={openCount}
            onChange={props.onChange}
            onClose={() => setIsEditing(false)}
            onClosed={() => !isEditing && setOpenCount(0)}
            open={isEditing}
            selected={selected}
          />
        </div>
      )}
    </div>
  );
}
