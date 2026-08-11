import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useEffect, useId, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { FormattedMessage } from 'react-intl';

export type DropdownOption = { label: ReactNode; value: string };

export type DropdownHandle = { focusTrigger: () => void };

/** DSFR hides the focus ring unless `:focus-visible` matches, which never happens when we move the focus here on behalf of the user after a mouse click */
const FORCED_FOCUS_RING = '[&[data-forced-focus]:focus]:[outline-style:solid]';

type DropdownProps = {
  className?: string;
  label?: ReactNode;
  options: readonly DropdownOption[];
  placeholder?: ReactNode;
  ref?: Ref<DropdownHandle>;
} & (
  | { multiple?: false; onSelect: (value: string | null) => void; selected: string | null }
  | { multiple: true; onSelect: (value: string[]) => void; selected: readonly string[] }
);

export function Dropdown(props: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const labelId = useId();
  const selectionId = useId();
  const triggerId = useId();

  useImperativeHandle(props.ref, () => ({
    focusTrigger() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      trigger.dataset.forcedFocus = '';
      trigger.addEventListener('blur', () => delete trigger.dataset.forcedFocus, { once: true });
      trigger.focus({ preventScroll: true });
    },
  }));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectedValues = props.multiple ? props.selected : props.selected !== null ? [props.selected] : [];

  const isSelected = (value: string) => selectedValues.includes(value);

  const selectedOptions = props.options.filter((option) => isSelected(option.value));

  const select = (value: string) => {
    if (props.multiple) {
      props.onSelect(
        isSelected(value)
          ? props.selected.filter((current) => current !== value)
          : [...props.selected, value],
      );
      return;
    }
    props.onSelect(isSelected(value) ? null : value);
    close();
  };

  const unselect = (value: string) => {
    if (!props.multiple) return;
    props.onSelect(props.selected.filter((current) => current !== value));
    triggerRef.current?.focus();
  };

  const singleValue =
    selectedOptions.length > 0 ? (
      <span className="flex flex-wrap gap-1">
        {selectedOptions.map((option) => (
          <span key={option.value}>{option.label}</span>
        ))}
      </span>
    ) : (
      <span className="text-(--text-mention-grey)">{props.placeholder}</span>
    );

  const trigger = (
    <button
      aria-controls={open ? listboxId : undefined}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-labelledby={clsx(props.label != null && labelId, props.multiple && selectionId) || undefined}
      className={clsx(
        'cursor-pointer text-left font-[inherit]',
        FORCED_FOCUS_RING,
        props.multiple
          ? 'absolute inset-0 h-full w-full [--active:transparent] [--hover:transparent]'
          : cx('fr-select'),
      )}
      id={triggerId}
      onClick={() => setOpen((value) => !value)}
      ref={triggerRef}
      type="button"
    >
      {props.multiple ? (
        <span className="fr-sr-only" id={selectionId}>
          {selectedOptions.length > 0 && (
            <FormattedMessage
              defaultMessage="{count, plural, one {# sélectionné} other {# sélectionnés}}"
              values={{ count: selectedOptions.length }}
            />
          )}
        </span>
      ) : (
        singleValue
      )}
    </button>
  );

  return (
    <div
      className={clsx('relative w-fit max-w-full', props.className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
      ref={rootRef}
    >
      {props.label != null && (
        <label className="fr-label fr-mb-1v" id={labelId}>
          {props.label}
        </label>
      )}
      {props.multiple ? (
        <div
          className={clsx(
            cx('fr-select'),
            'relative text-left',
            selectedOptions.length === 0 && 'hover:bg-(--background-contrast-grey-hover)',
          )}
        >
          {trigger}
          <span className="pointer-events-none relative flex flex-wrap items-center gap-1">
            {selectedOptions.length === 0 && (
              <span className="text-(--text-mention-grey)">{props.placeholder}</span>
            )}
            {selectedOptions.map((option) => (
              <span className="flex items-center gap-1" key={option.value}>
                {option.label}
                <button
                  className="fr-icon-close-line fr-icon--sm pointer-events-auto cursor-pointer rounded-full text-(--text-action-high-blue-france)"
                  onClick={() => unselect(option.value)}
                  type="button"
                >
                  <span className="fr-sr-only">
                    <FormattedMessage defaultMessage="Retirer" /> {option.label}
                  </span>
                </button>
              </span>
            ))}
          </span>
        </div>
      ) : (
        trigger
      )}

      {open && (
        <ul
          aria-labelledby={triggerId}
          aria-multiselectable={props.multiple}
          className="fr-m-0 fr-p-0 absolute top-full left-0 z-10 mt-1 max-h-80 w-max max-w-80 min-w-full list-none overflow-y-auto rounded-b border border-(--border-default-grey) bg-(--background-default-grey) shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          id={listboxId}
          role="listbox"
        >
          {props.options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                aria-selected={isSelected(option.value)}
                className="fr-px-2v fr-py-2v flex w-full items-center justify-between gap-2 text-left hover:bg-(--background-default-grey-hover)"
                onClick={() => select(option.value)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {isSelected(option.value) && (
                  <span
                    aria-hidden
                    className="fr-icon-check-line fr-icon--sm text-(--text-action-high-blue-france)"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
