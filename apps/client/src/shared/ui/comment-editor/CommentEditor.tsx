import Button from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export function CommentEditor(props: {
  ariaLabel: string;
  emptyLabel: ReactNode;
  initialValue: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  readOnly?: boolean;
  warning?: boolean;
}) {
  const { formatMessage } = useIntl();
  const { onDirtyChange } = props;

  const [saved, setSaved] = useState(props.initialValue ?? '');
  const [value, setValue] = useState(saved);
  const [hasError, setHasError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isDirty = value !== saved;
  const showActions = isFocused || isDirty || !!props.warning;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  if (props.readOnly) {
    return (
      <div
        aria-label={props.ariaLabel}
        className="fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey) whitespace-pre-line"
      >
        {props.initialValue || props.emptyLabel}
      </div>
    );
  }

  const change = (next: string) => {
    setValue(next);
    setHasError(false);
  };
  const cancel = () => {
    setValue(saved);
    setHasError(false);
  };
  const save = async () => {
    setIsPending(true);
    try {
      await props.onSave(value || null);
      setSaved(value);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  };

  const errorMessage = hasError
    ? formatMessage({ defaultMessage: "Échec de l'enregistrement. Réessayez." })
    : props.warning
      ? formatMessage({
          defaultMessage: 'Modifications non enregistrées. Cliquez sur Valider pour sauvegarder.',
        })
      : undefined;

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
    >
      <Input
        label=""
        nativeTextAreaProps={{
          'aria-label': props.ariaLabel,
          onChange: (event) => change(event.target.value),
          placeholder: props.placeholder,
          rows: 4,
          value,
        }}
        state={hasError || props.warning ? 'error' : 'default'}
        stateRelatedMessage={errorMessage}
        textArea
      />
      <div
        aria-hidden={!showActions}
        className={clsx(
          'grid transition-all duration-200 ease-out',
          showActions ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex justify-end gap-2">
            <Button
              className="btn-compact"
              disabled={!isDirty || isPending}
              onClick={cancel}
              priority="secondary"
              size="small"
            >
              <FormattedMessage defaultMessage="Annuler" />
            </Button>
            <Button
              className="btn-compact"
              disabled={!isDirty || isPending}
              onClick={save}
              priority="primary"
              size="small"
            >
              <FormattedMessage defaultMessage="Valider" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
