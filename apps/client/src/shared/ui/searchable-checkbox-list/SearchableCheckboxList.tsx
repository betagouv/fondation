import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useId, useRef, useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { SearchInput } from '@/shared/ui/search-input';
import { unaccent } from '@/utils/string.utils';

type Option = { aside?: ReactNode; hint?: ReactNode; id: string; label: ReactNode };

export function matchesSearch(label: string, search: string): boolean {
  return unaccent(label).toLowerCase().includes(unaccent(search.trim()).toLowerCase());
}

function OptionRow(props: { checked: boolean; onToggle: () => void; option: Option }) {
  const id = useId();
  const asideRef = useRef<HTMLDivElement>(null);
  return (
    <li
      className="fr-px-3v fr-py-2v flex cursor-pointer items-center justify-between gap-4 border-b border-(--border-default-grey) last:border-b-0 hover:bg-(--background-default-grey-hover)"
      onClick={(event) => {
        const target = event.target as Node;
        if (event.currentTarget.querySelector('.fr-checkbox-group')?.contains(target)) return;
        if (asideRef.current?.contains(target)) return;
        props.onToggle();
      }}
    >
      <div className={cx('fr-checkbox-group', 'fr-checkbox-group--sm')}>
        <input checked={props.checked} id={id} onChange={props.onToggle} type="checkbox" />
        <label className="fr-label" htmlFor={id}>
          {props.option.label}
          {props.option.hint && <span className="fr-hint-text">{props.option.hint}</span>}
        </label>
      </div>
      {props.option.aside && (
        <div className="shrink-0" ref={asideRef}>
          {props.option.aside}
        </div>
      )}
    </li>
  );
}

export function SearchableCheckboxList(props: {
  checked: readonly string[];
  buttonsLabelSuffix?: string;
  /** shows the checked options alone: only for a screen that lists every option rather than the results of a search */
  canShowCheckedOnly?: boolean;
  countLabel: ReactNode;
  emptyLabel: ReactNode;
  error?: ReactNode;
  isLoading?: boolean;
  legend: ReactNode;
  onChange: (checked: string[]) => void;
  onEndReached?: () => void;
  onSearchChange: (search: string) => void;
  options: readonly Option[];
  search: string;
  searchLabel: string;
}) {
  const errorId = useId();
  const searchRef = useRef<HTMLDivElement>(null);
  // the options checked when the choice shows alone: one unchecked keeps its line and its focus
  const [shownIds, setShownIds] = useState<readonly string[] | null>(null);
  const isOnlyChecked = shownIds !== null;
  const shown = shownIds ? props.options.filter(({ id }) => shownIds.includes(id)) : props.options;
  const suffix = props.buttonsLabelSuffix && (
    <>
      {' '}
      <span className="fr-sr-only">{props.buttonsLabelSuffix}</span>
    </>
  );
  const change = (checked: string[]) => {
    if (checked.length === 0) setShownIds(null);
    props.onChange(checked);
  };
  const toggle = (id: string) =>
    change(
      props.checked.includes(id) ? props.checked.filter((other) => other !== id) : [...props.checked, id],
    );

  return (
    <fieldset
      aria-describedby={props.error ? errorId : undefined}
      className="fr-m-0 fr-p-0 flex flex-col gap-2 border-0"
    >
      <legend className="fr-mb-2v fr-text--md mx-0 px-0 pb-0 font-bold">{props.legend}</legend>
      <div ref={searchRef}>
        <SearchInput
          onChange={props.onSearchChange}
          onClear={() => props.onSearchChange('')}
          placeholder={props.searchLabel}
          value={props.search}
        />
      </div>
      <div className="rounded border border-(--border-default-grey)">
        <ul
          className="fr-m-0 fr-p-0 max-h-64 list-none overflow-y-auto"
          onScroll={(event) => {
            const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
            if (!isOnlyChecked && scrollHeight - scrollTop - clientHeight < 100) props.onEndReached?.();
          }}
        >
          {shown.map((option) => (
            <OptionRow
              checked={props.checked.includes(option.id)}
              key={option.id}
              onToggle={() => toggle(option.id)}
              option={option}
            />
          ))}
        </ul>
        {/* mounted before the list empties so that a screen reader announces the message */}
        <p className="fr-mb-0 text-center text-sm text-(--text-mention-grey)" role="status">
          {props.isLoading ? (
            <span className="fr-py-4v block">
              <FormattedMessage defaultMessage="Chargement…" />
            </span>
          ) : (
            shown.length === 0 &&
            props.emptyLabel && <span className="fr-py-4v block">{props.emptyLabel}</span>
          )}
        </p>
        <div className="fr-px-3v fr-py-1v flex items-center justify-between gap-2 border-t border-(--border-default-grey) bg-(--background-alt-grey)">
          <p className="fr-mb-0 text-xs text-(--text-mention-grey)" role="status">
            {props.countLabel}
          </p>
          {props.checked.length > 0 && (
            <div className="flex flex-wrap justify-end">
              {props.canShowCheckedOnly && (
                <Button
                  onClick={() => {
                    if (!isOnlyChecked) props.onSearchChange('');
                    setShownIds(isOnlyChecked ? null : [...props.checked]);
                  }}
                  priority="tertiary no outline"
                  size="small"
                  type="button"
                >
                  {isOnlyChecked ? (
                    <FormattedMessage defaultMessage="Tout afficher" />
                  ) : (
                    <FormattedMessage defaultMessage="Afficher la sélection" />
                  )}
                  {suffix}
                </Button>
              )}
              <Button
                onClick={() => {
                  change([]);
                  // the button goes away: the focus would fall back on the page
                  searchRef.current?.querySelector('input')?.focus();
                }}
                priority="tertiary no outline"
                size="small"
                type="button"
              >
                <FormattedMessage defaultMessage="Tout désélectionner" />
                {suffix}
              </Button>
            </div>
          )}
        </div>
      </div>
      {props.error && (
        <p className="fr-error-text fr-mt-0 fr-mb-0" id={errorId}>
          {props.error}
        </p>
      )}
    </fieldset>
  );
}
