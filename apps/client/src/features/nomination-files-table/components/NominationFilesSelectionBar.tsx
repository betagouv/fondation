import { FormattedMessage } from 'react-intl';

export function NominationFilesSelectionBar(props: { selectedCount: number; totalCount: number }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <p
        aria-live="polite"
        className="fr-px-4v fr-m-0 flex min-h-10 items-center bg-(--background-alt-blue-france) text-sm font-medium"
      >
        <FormattedMessage
          defaultMessage={`{count, plural,
            =0 {Aucune proposition sélectionnée}
            one {1 proposition sélectionnée}
            other {{count, number} propositions sélectionnées}} sur {total, number}`}
          values={{ count: props.selectedCount, total: props.totalCount }}
        />
      </p>
    </div>
  );
}
