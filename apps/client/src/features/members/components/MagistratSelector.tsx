import { FormattedMessage, useIntl } from 'react-intl';

import { ExclusionSelector } from './ExclusionSelector';
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

export function MagistratSelector(props: {
  excluded: readonly ExcludedMagistrat[];
  onChange: (magistratIds: readonly string[]) => Promise<unknown>;
}) {
  const { formatMessage } = useIntl();

  return (
    <ExclusionSelector
      editLabel={formatMessage({ defaultMessage: 'Éditer les magistrats exclus' })}
      modalTitle={<FormattedMessage defaultMessage="Sélection des magistrats" />}
      onSave={props.onChange}
      originalIds={props.excluded.map(({ id }) => id)}
      picker={({ selected, setSelected }) => (
        <MagistratAutocomplete excluded={props.excluded} onChange={setSelected} selected={selected} />
      )}
      saved={<ExcludedMagistratList excluded={props.excluded} />}
    />
  );
}
