import clsx from 'clsx';
import { useId, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export function Upload(props: {
  accept?: string;
  hasError?: boolean;
  hint?: ReactNode;
  isPending?: boolean;
  label: ReactNode;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const inputId = useId();

  return (
    <label
      className={clsx(
        'fr-p-4v block bg-(--background-alt-grey)',
        props.isPending ? 'cursor-default' : 'cursor-pointer',
      )}
      htmlFor={inputId}
    >
      <span className={clsx('fr-label', props.hasError && 'fr-label--error')}>
        {props.label}
        {props.hint && <span className="fr-hint-text mt-3">{props.hint}</span>}
      </span>

      <input
        accept={props.accept}
        className="fr-upload mt-4"
        disabled={props.isPending}
        id={inputId}
        multiple={props.multiple}
        onChange={(event) => props.onChange([...(event.target.files ?? [])])}
        type="file"
      />

      {props.isPending && (
        <p aria-live="polite" className="fr-mt-2v fr-mb-0 text-sm text-(--text-mention-grey)">
          <span aria-hidden="true" className="fr-icon-refresh-line fr-icon--sm fr-mr-1v" />
          <FormattedMessage defaultMessage="Import du fichier en cours..." />
        </p>
      )}
    </label>
  );
}
