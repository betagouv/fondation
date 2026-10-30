import clsx from 'clsx';
import { useId, useRef, useState, type ReactNode } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

// see apps/api/src/modules/framework/files
export const ATTACHMENT_MAX_BYTES = 50 * 1_024 * 1_024;
export const FILES_PER_UPLOAD = 20;

type Refusal =
  | { files: number; reason: 'tooMany' }
  | { name: string; reason: 'tooLarge' }
  | { name: string; reason: 'unaccepted' };

const REFUSALS = defineMessages({
  tooLarge: { defaultMessage: 'Le fichier "{name}" dépasse {megabytes} Mo.' },
  tooMany: {
    defaultMessage: '{files, plural, one {Un seul fichier par envoi.} other {# fichiers au plus par envoi.}}',
  },
  unaccepted: { defaultMessage: `Le format du fichier "{name}" n'est pas accepté.` },
});

/** a dropped file skips the filter of the file picker */
function isAccepted(file: File, accept: string | undefined): boolean {
  if (!accept) return true;

  const name = file.name.toLowerCase();
  return accept.split(',').some((type) => (type.startsWith('.') ? name.endsWith(type) : file.type === type));
}

function refusalOf(
  files: readonly File[],
  caps: { accept?: string; files: number; maxBytes: number },
): Refusal | null {
  if (files.length > caps.files) return { files: caps.files, reason: 'tooMany' };

  const unaccepted = files.find((file) => !isAccepted(file, caps.accept));
  if (unaccepted) return { name: unaccepted.name, reason: 'unaccepted' };

  const heavy = files.find((file) => file.size > caps.maxBytes);
  return heavy ? { name: heavy.name, reason: 'tooLarge' } : null;
}

export function Upload(props: {
  accept?: string;
  clearOnChange?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  hint?: ReactNode;
  isPending?: boolean;
  /** a document of its own, rather than attachments */
  label?: ReactNode;
  maxBytes?: number;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const input = useRef<HTMLInputElement>(null);
  const isLocked = props.disabled || props.isPending;
  const maxBytes = props.maxBytes ?? ATTACHMENT_MAX_BYTES;
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);

  return (
    <div
      className={clsx(
        'fr-p-4v bg-(--background-alt-grey)',
        isDraggedOver && 'outline-2 outline-(--border-active-blue-france) outline-dashed',
      )}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggedOver(false);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = isLocked ? 'none' : 'copy';
        if (!isLocked) setIsDraggedOver(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggedOver(false);
        if (isLocked || !input.current || event.dataTransfer.files.length === 0) return;

        // the dropped files go through the input, for it to show them and to apply the same rules
        input.current.files = event.dataTransfer.files;
        input.current.dispatchEvent(new Event('change', { bubbles: true }));
      }}
    >
      <label className={clsx('block', isLocked ? 'cursor-default' : 'cursor-pointer')} htmlFor={inputId}>
        <span className={clsx('fr-label', (props.hasError || refusal) && 'fr-label--error')}>
          {props.label ??
            (props.multiple ? (
              <FormattedMessage defaultMessage="Ajouter ou glisser-déposer des fichiers" />
            ) : (
              <FormattedMessage defaultMessage="Ajouter ou glisser-déposer un fichier" />
            ))}
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
            const refused = refusalOf(files, {
              accept: props.accept,
              files: props.multiple ? FILES_PER_UPLOAD : 1,
              maxBytes,
            });
            setRefusal(refused);
            if (refused || props.clearOnChange) event.target.value = '';
            if (!refused) props.onChange(files);
            // the input is now empty: the parent must forget the selection it holds
            else if (!props.clearOnChange) props.onChange([]);
          }}
          ref={input}
          type="file"
        />
      </label>

      {refusal && (
        <p className="fr-error-text fr-mb-0" id={errorId} role="alert">
          <FormattedMessage
            {...REFUSALS[refusal.reason]}
            values={{ ...refusal, megabytes: maxBytes / 1_024 / 1_024 }}
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
