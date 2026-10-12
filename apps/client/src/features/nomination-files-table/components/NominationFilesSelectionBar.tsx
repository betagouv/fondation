import { FormattedMessage } from 'react-intl';

export function NominationFilesSelectionBar(props: { selectedCount: number; totalCount: number }) {
  return (
    <p aria-live="polite" className="fr-m-0 text-sm">
      <FormattedMessage
        defaultMessage={`{count, plural,
          =0 {Aucune proposition sélectionnée}
          one {1 proposition sélectionnée sur {total, number}}
          other {{count, number} propositions sélectionnées sur {total, number}}}`}
        values={{ count: props.selectedCount, total: props.totalCount }}
      />
    </p>
  );
}
