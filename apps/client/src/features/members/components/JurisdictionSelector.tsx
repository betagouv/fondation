import Tag from '@codegouvfr/react-dsfr/Tag';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExclusionSelector } from './ExclusionSelector';
import { JuridictionAutocomplete } from './JurisdictionAutocomplete';

function JurisdictionSelectorSelected(props: { selected: readonly { id: string; label: string | null }[] }) {
  if (props.selected.length === 0) return <span className="font-bold text-(--text-disabled-grey)">n/a</span>;

  return (
    <ul className="fr-p-0 flex list-none flex-row flex-wrap items-center justify-end gap-2">
      {props.selected.map(({ id, label }) => (
        <li className="shrink-0 grow-0" key={`jurisdiction_${id}`}>
          <Tag>{label ?? id}</Tag>
        </li>
      ))}
    </ul>
  );
}

export function JurisdictionSelector(props: {
  onChange: (selected: readonly string[]) => Promise<unknown>;
  selected: readonly { id: string; label: string | null }[];
}) {
  const { formatMessage } = useIntl();

  return (
    <ExclusionSelector
      editLabel={formatMessage({ defaultMessage: 'Éditer les juridictions exclues' })}
      modalTitle={<FormattedMessage defaultMessage="Sélection des juridictions" />}
      onSave={props.onChange}
      originalIds={props.selected.map(({ id }) => id)}
      picker={({ setSelected }) => (
        <JuridictionAutocomplete onChange={setSelected} selected={props.selected} />
      )}
      saved={<JurisdictionSelectorSelected selected={props.selected} />}
    />
  );
}
