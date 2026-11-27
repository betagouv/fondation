import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useEffect, useId, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { MagistratGradeAndPosition } from '@/features/magistrats/components/MagistratGradeAndPosition';
import { MagistratStatusBadge } from '@/features/magistrats/components/MagistratStatusBadge';
import { currentPositionLabel } from '@/features/magistrats/utils/magistrat-position.utils';
import { RequiredLabel } from '@/shared/ui/required-label';
import { SearchInput } from '@/shared/ui/search-input';
import { MAGISTRAT_SEARCH_MIN_LENGTH, type FoundMagistrat } from '@queries/magistrats.queries';
import { useSearchMagistratsQuery, type Observant } from '@queries/observations.queries';

const searchTermFor = (magistrat: Observant) => `${magistrat.lastName} ${magistrat.firstName}`;

const toObservant = (magistrat: FoundMagistrat): Observant => ({
  currentPosition: currentPositionLabel(magistrat.currentPosition),
  firstName: magistrat.firstName,
  id: magistrat.id,
  lastName: magistrat.lastName,
  name: magistrat.name,
});

export function MagistratCombobox(props: {
  errorMessage?: string;
  hint: ReactNode;
  label: ReactNode;
  magistrat: Observant | null;
  onChange: (magistrat: Observant | null) => void;
  /** the results push the actions down rather than be cut off by the scrolling content of the modal */
  inShortModal?: boolean;
}) {
  const intl = useIntl();
  const { magistrat, onChange } = props;

  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputId = `${id}-input`;
  const errorId = `${id}-error`;
  const optionId = (magistratId: string) => `${id}-option-${magistratId}`;

  const [searchTerm, setSearchTerm] = useState(magistrat ? searchTermFor(magistrat) : '');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (magistrat) setSearchTerm(searchTermFor(magistrat));
  }, [magistrat]);

  const { data, isError, isLoading: isSearching } = useSearchMagistratsQuery(debouncedSearch);
  const results = data ?? [];
  const isOpen = showResults && debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH;
  const activeMagistrat = isOpen ? results[activeIndex] : undefined;

  const select = (selected: FoundMagistrat) => {
    const observant = toObservant(selected);
    onChange(observant);
    setSearchTerm(searchTermFor(observant));
    setShowResults(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setShowResults(false);
      return;
    }
    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + results.length) % results.length);
    } else if (event.key === 'Enter' && activeMagistrat) {
      event.preventDefault();
      select(activeMagistrat);
    }
  };

  const closeOnFocusLeave = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setShowResults(false);
  };

  return (
    <div className="relative" onBlur={closeOnFocusLeave}>
      <div className={clsx('fr-input-group fr-mb-0', props.errorMessage && 'fr-input-group--error')}>
        <label className="fr-label" htmlFor={inputId}>
          <RequiredLabel>{props.label}</RequiredLabel>
          <span className="fr-hint-text">{props.hint}</span>
        </label>
        <SearchInput
          className="fr-mt-1w"
          id={inputId}
          inputProps={{
            'aria-activedescendant': activeMagistrat ? optionId(activeMagistrat.id) : undefined,
            'aria-autocomplete': 'list',
            'aria-controls': listboxId,
            'aria-describedby': props.errorMessage ? errorId : undefined,
            'aria-expanded': isOpen,
            'aria-invalid': props.errorMessage ? true : undefined,
            className: clsx(props.errorMessage && 'fr-input--error'),
            onFocus: () => setShowResults(true),
            onKeyDown,
            role: 'combobox',
          }}
          onChange={(value) => {
            setSearchTerm(value);
            setShowResults(true);
            setActiveIndex(0);
            if (magistrat && value !== searchTermFor(magistrat)) onChange(null);
          }}
          onClear={() => {
            setSearchTerm('');
            onChange(null);
          }}
          placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
          value={searchTerm}
        />
        {props.errorMessage && (
          <p className="fr-error-text" id={errorId}>
            {props.errorMessage}
          </p>
        )}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'fr-mt-1v max-h-60 w-full overflow-y-auto rounded-sm border bg-(--background-default-grey)',
            !props.inShortModal && 'absolute z-(--z-index-popover) shadow-lg',
          )}
        >
          {isSearching && (
            <p className="fr-p-3v fr-mb-0 text-sm text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Recherche…" />
            </p>
          )}
          {isError && (
            <p className="fr-p-3v fr-mb-0 text-sm text-(--text-default-error)">
              <FormattedMessage defaultMessage="La recherche n'a pas pu aboutir" />
            </p>
          )}
          {!isSearching && !isError && results.length === 0 && (
            <p className="fr-p-3v fr-mb-0 text-sm text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Aucun résultat" />
            </p>
          )}
          <div
            aria-label={intl.formatMessage({ defaultMessage: 'Magistrats correspondants' })}
            id={listboxId}
            role="listbox"
          >
            {results.map((result, index) => (
              <div
                aria-selected={index === activeIndex}
                className={clsx(
                  'fr-p-3v cursor-pointer border-b text-left',
                  index === activeIndex && 'bg-(--background-default-grey-hover)',
                )}
                id={optionId(result.id)}
                key={result.id}
                onClick={() => select(result)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
              >
                <div className="font-medium">
                  {result.name} <MagistratStatusBadge className="ml-1" status={result.status} />
                </div>
                <div className="text-xs text-(--text-mention-grey)">
                  <MagistratGradeAndPosition {...result} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {magistrat && !props.inShortModal && (
        <div className="fr-mt-2v fr-p-2v flex items-center gap-2">
          <Tag
            as="button"
            dismissible
            nativeButtonProps={{
              onClick: () => {
                onChange(null);
                setSearchTerm('');
              },
            }}
          >
            {magistrat.name}
            {magistrat.currentPosition && ` - ${magistrat.currentPosition}`}
          </Tag>
        </div>
      )}
    </div>
  );
}
