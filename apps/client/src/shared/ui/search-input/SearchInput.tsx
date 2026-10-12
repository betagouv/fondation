import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useState } from 'react';
import { useIntl } from 'react-intl';

export function SearchInput(props: {
  className?: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  value: string;
}) {
  const intl = useIntl();
  const [isFocused, setIsFocused] = useState(false);
  const hasText = props.value.length > 0;
  const clearLabel = intl.formatMessage({ defaultMessage: 'Effacer la recherche' });
  const searchLabel = props.placeholder ?? intl.formatMessage({ defaultMessage: 'Rechercher' });

  return (
    <div className={clsx('relative', props.className)} role="search">
      <input
        aria-label={searchLabel}
        className={clsx(cx('fr-input'), 'pr-12')}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => props.onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={searchLabel}
        type="text"
        value={props.value}
      />
      {hasText ? (
        <button
          aria-label={clearLabel}
          className={clsx(
            cx('fr-icon-close-circle-fill'),
            'absolute top-0 right-0 flex h-full w-10 items-center justify-center rounded-tr bg-(--background-action-high-blue-france) text-(--text-inverted-blue-france) hover:bg-(--background-action-high-blue-france-hover)',
          )}
          onClick={props.onClear}
          title={clearLabel}
          type="button"
        />
      ) : (
        !isFocused && (
          <span
            aria-hidden
            className={clsx(
              cx('fr-icon-search-line'),
              'pointer-events-none absolute top-0 right-0 flex h-full w-10 items-center justify-center rounded-tr bg-(--background-action-high-blue-france) text-(--text-inverted-blue-france)',
            )}
          />
        )
      )}
    </div>
  );
}
