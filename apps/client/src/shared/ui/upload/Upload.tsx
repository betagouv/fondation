import clsx from 'clsx';
import { useId, useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

// see FILES_PER_UPLOAD in apps/api/src/modules/framework/files
export const FILES_PER_UPLOAD = 20;

export function Upload(props: {
  accept?: string;
  clearOnChange?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  hint?: ReactNode;
  isPending?: boolean;
  label: ReactNode;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const isLocked = props.disabled || props.isPending;
  const [tooMany, setTooMany] = useState(false);

  return (
    <label
      className={clsx(
        'fr-p-4v block bg-(--background-alt-grey)',
        isLocked ? 'cursor-default' : 'cursor-pointer',
      )}
      htmlFor={inputId}
    >
      <span className={clsx('fr-label', (props.hasError || tooMany) && 'fr-label--error')}>
        {props.label}
        {props.hint && <span className="fr-hint-text mt-3">{props.hint}</span>}
      </span>

      <input
        accept={props.accept}
        aria-describedby={tooMany ? errorId : undefined}
        className="fr-upload mt-4"
        disabled={isLocked}
        id={inputId}
        multiple={props.multiple}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          const refused = files.length > FILES_PER_UPLOAD;
          setTooMany(refused);
          if (refused || props.clearOnChange) event.target.value = '';
          if (!refused) props.onChange(files);
        }}
        type="file"
      />

      {tooMany && (
        <span className="fr-error-text block" id={errorId} role="alert">
          <FormattedMessage
            defaultMessage="{max} fichiers au plus par envoi."
            values={{ max: FILES_PER_UPLOAD }}
          />
        </span>
      )}

      {props.isPending && (
        <span aria-live="polite" className="fr-mt-2v block text-sm text-(--text-mention-grey)">
          <span aria-hidden="true" className="fr-icon-refresh-line fr-icon--sm fr-mr-1v" />
          <FormattedMessage defaultMessage="Import du fichier en cours..." />
        </span>
      )}
    </label>
  );
}
