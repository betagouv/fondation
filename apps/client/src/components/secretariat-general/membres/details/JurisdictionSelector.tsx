import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import Tag from '@codegouvfr/react-dsfr/Tag';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { useState } from 'react';
import { JuridictionAutocomplete } from './JurisdictionAutocomplete';

function JurisdictionSelectorSelected(props: { selected: readonly { id: string; label: string | null }[] }) {
  if (props.selected.length === 0) return <span className="font-bold text-gray-300">n/a</span>;

  return (
    <>
      <ul className="flex list-none flex-row flex-wrap items-center gap-x-2 p-0">
        {props.selected.slice(0, 4).map(({ id, label }) => (
          <li key={`jurisdiction_${id}`} className="flex-shrink-0 flex-grow-0">
            <Tag>{label ?? id}</Tag>
          </li>
        ))}
        {props.selected.length > 4 ? (
          <li className="flex-shrink-0 whitespace-nowrap">
            <Tooltip
              className="flex-shrink-0"
              title={
                <ul>
                  {props.selected.map(({ label, id }) => (
                    <li key={`excluded_jurisdictions_tooltip_${id}`}>{label ?? id}</li>
                  ))}
                </ul>
              }
            >
              <Tag
                small
                nativeButtonProps={{
                  className: 'flex-shrink-0 cursor-help whitespace-nowrap'
                }}
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

const modal = createModal({ id: `jurisdiction-selector-modal`, isOpenedByDefault: false });
function JurisdictionSelectorModal(props: {
  selected: readonly { id: string; label: string | null }[];
  onChange?: (selected: readonly string[]) => Promise<unknown>;
}) {
  const [isChanging, setIsChanging] = useState(false);
  const [didChange, setDidChange] = useState(false);
  const [selected, setSelected] = useState<string[]>(props.selected.map(({ id }) => id));
  const isOpen = useIsModalOpen(modal);

  return (
    <div className="text-left">
      <modal.Component
        title="Sélection des juridictions"
        size="large"
        buttons={[
          { children: 'Annuler' },
          {
            children: isChanging ? 'Sauvegarde...' : 'Sauvegarder',
            disabled: !didChange || isChanging,
            doClosesModal: false,
            onClick: async () => {
              setIsChanging(true);
              try {
                await props.onChange?.(selected);
                modal.close();
              } finally {
                setIsChanging(false);
              }
            }
          }
        ]}
      >
        {isOpen ? (
          <JuridictionAutocomplete
            selected={props.selected}
            onChange={(newSelected) => {
              setSelected(newSelected);
              setDidChange(true);
            }}
          />
        ) : null}
      </modal.Component>
    </div>
  );
}

export function JurisdictionSelector(props: {
  selected?: readonly { id: string; label: string | null }[];
  onChange?: (selected: readonly string[]) => Promise<unknown>;
}) {
  const selected = props.selected ?? [];

  return (
    <div className="flex items-center gap-x-2">
      <JurisdictionSelectorSelected selected={selected} />
      <Button
        size="small"
        className="rounded-full"
        iconId="fr-icon-edit-fill"
        priority="tertiary no outline"
        title="Éditer les juridictions exclues"
        nativeButtonProps={modal.buttonProps}
        onClick={() => modal.open()}
      />

      <JurisdictionSelectorModal selected={selected} onChange={props.onChange} />
    </div>
  );
}
