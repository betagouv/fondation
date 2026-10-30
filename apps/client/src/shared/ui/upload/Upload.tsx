import clsx from 'clsx';
import { useId, useState, type ReactNode } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

// see apps/api/src/modules/framework/files
export const ATTACHMENT_MAX_BYTES = 50 * 1_024 * 1_024;
export const FILES_PER_UPLOAD = 20;

type Refusal = { name: string; reason: 'tooLarge' } | { reason: 'tooMany' };

const REFUSALS = defineMessages({
  tooLarge: { defaultMessage: 'Le fichier "{name}" dépasse {megabytes} Mo.' },
  tooMany: { defaultMessage: '{files} fichiers au plus par envoi.' },
});

function refusalOf(files: readonly File[], maxBytes: number): Refusal | null {
  if (files.length > FILES_PER_UPLOAD) return { reason: 'tooMany' };

  const heavy = files.find((file) => file.size > maxBytes);
  return heavy ? { name: heavy.name, reason: 'tooLarge' } : null;
}

export function Upload(props: {
  accept?: string;
  clearOnChange?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  hint?: ReactNode;
  isPending?: boolean;
  label: ReactNode;
  maxBytes?: number;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const isLocked = props.disabled || props.isPending;
  const maxBytes = props.maxBytes ?? ATTACHMENT_MAX_BYTES;
  const [refusal, setRefusal] = useState<Refusal | null>(null);

  return (
    <div className="fr-p-4v bg-(--background-alt-grey)">
      <label className={clsx('block', isLocked ? 'cursor-default' : 'cursor-pointer')} htmlFor={inputId}>
        <span className={clsx('fr-label', (props.hasError || refusal) && 'fr-label--error')}>
          {props.label}
          {props.hint && <span className="fr-hint-text mt-3">{props.hint}</span>}
        </span>

        <input
          accept={props.accept}
          aria-describedby={refusal ? errorId : undefined}
          className="fr-upload mt-4"
          disabled={isLocked}
          id={inputId}
          multiple={props.multiple}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            const refused = refusalOf(files, maxBytes);
            setRefusal(refused);
            if (refused || props.clearOnChange) event.target.value = '';
            if (!refused) props.onChange(files);
            // the input is now empty: the parent must forget the selection it holds
            else if (!props.clearOnChange) props.onChange([]);
          }}
          type="file"
        />
      </label>

      {refusal && (
        <p className="fr-error-text fr-mb-0" id={errorId} role="alert">
          <FormattedMessage
            {...REFUSALS[refusal.reason]}
            values={{ ...refusal, files: FILES_PER_UPLOAD, megabytes: maxBytes / 1_024 / 1_024 }}
          />
        </p>
      )}

      {props.isPending && (
        <p aria-live="polite" className="fr-mt-2v fr-mb-0 text-sm text-(--text-mention-grey)">
          <span aria-hidden="true" className="fr-icon-refresh-line fr-icon--sm fr-mr-1v" />
          <FormattedMessage defaultMessage="Import du fichier en cours..." />
        </p>
      )}
    </div>
  );
}
