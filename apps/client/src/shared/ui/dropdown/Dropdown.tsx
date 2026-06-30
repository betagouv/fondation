import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type DropdownOption = { label: ReactNode; value: string };

type DropdownProps = {
  className?: string;
  label?: ReactNode;
  options: readonly DropdownOption[];
  placeholder?: ReactNode;
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
  const triggerId = useId();

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

  const selectedLabels = props.options
    .filter((option) => isSelected(option.value))
    .map((option) => option.label);

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

  return (
    <div
      ref={rootRef}
      className={clsx('relative w-fit max-w-full', props.className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      {props.label != null && (
        <label className="fr-label fr-mb-1v" id={labelId}>
          {props.label}
        </label>
      )}
      <button
        ref={triggerRef}
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={props.label != null ? labelId : undefined}
        id={triggerId}
        className={clsx(cx('fr-select'), 'cursor-pointer text-left font-[inherit]')}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {selectedLabels.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selectedLabels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </span>
        ) : (
          <span className="text-(--text-mention-grey)">{props.placeholder}</span>
        )}
      </button>

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
