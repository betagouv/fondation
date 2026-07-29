import { Input } from '@codegouvfr/react-dsfr/Input';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useEffect, useId, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { Mandatory } from '@/shared/ui/Mandatory';
import { fullNameUpperCase } from '@/utils/user.utils';
import { useSearchMagistratsQuery, type MagistratSearchResult } from '@queries/observations.queries';

const searchTermFor = (magistrat: MagistratSearchResult) => `${magistrat.lastName} ${magistrat.firstName}`;

const magistratDetails = (magistrat: MagistratSearchResult) =>
  [magistrat.grade, magistrat.currentPosition]
    .flatMap((detail) => {
      const trimmed = detail?.trim();
      return trimmed ? [trimmed] : [];
    })
    .join(' - ');

export function MagistratCombobox(props: {
  errorMessage?: string;
  magistrat: MagistratSearchResult | null;
  onChange: (magistrat: MagistratSearchResult | null) => void;
}) {
  const intl = useIntl();
  const { magistrat, onChange } = props;

  const id = useId();
  const listboxId = `${id}-listbox`;
  const optionId = (magistratId: string) => `${id}-option-${magistratId}`;

  const [searchTerm, setSearchTerm] = useState(magistrat ? searchTermFor(magistrat) : '');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (magistrat) setSearchTerm(searchTermFor(magistrat));
  }, [magistrat]);

  const { data, isLoading: isSearching } = useSearchMagistratsQuery(debouncedSearch);
  const results = data ?? [];
  const isOpen = showResults && debouncedSearch.length >= 2;
  const activeMagistrat = isOpen ? results[activeIndex] : undefined;

  const select = (selected: MagistratSearchResult) => {
    onChange(selected);
    setSearchTerm(searchTermFor(selected));
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
      <Input
        classes={{ root: 'fr-mb-0' }}
        hintText={intl.formatMessage({ defaultMessage: 'Nom, Prénom ou Adresse email pro' })}
        iconId="fr-icon-search-line"
        label={
          <Mandatory>
            <FormattedMessage defaultMessage="Magistrat observant" />
          </Mandatory>
        }
        nativeInputProps={{
          'aria-activedescendant': activeMagistrat ? optionId(activeMagistrat.id) : undefined,
          'aria-autocomplete': 'list',
          'aria-controls': listboxId,
          'aria-expanded': isOpen,
          onChange: (event) => {
            setSearchTerm(event.target.value);
            setShowResults(true);
            setActiveIndex(0);
            if (event.target.value === '') onChange(null);
          },
          onFocus: () => setShowResults(true),
          onKeyDown,
          placeholder: intl.formatMessage({ defaultMessage: 'Rechercher un magistrat' }),
          role: 'combobox',
          type: 'search',
          value: searchTerm,
        }}
        state={props.errorMessage ? 'error' : 'default'}
        stateRelatedMessage={props.errorMessage}
      />

      {isOpen && (
        <div className="fr-mt-1v absolute z-[9999] max-h-60 w-full overflow-y-auto rounded-sm border bg-(--background-default-grey) shadow-lg">
          {isSearching && (
            <p className="fr-p-3v fr-mb-0 text-sm text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Recherche…" />
            </p>
          )}
          {!isSearching && results.length === 0 && (
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
                <div className="font-medium">{fullNameUpperCase(result)}</div>
                <div className="text-xs text-(--text-mention-grey)">{magistratDetails(result)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {magistrat && (
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
            {fullNameUpperCase(magistrat)}
            {magistrat.currentPosition && ` - ${magistrat.currentPosition}`}
          </Tag>
        </div>
      )}
    </div>
  );
}
