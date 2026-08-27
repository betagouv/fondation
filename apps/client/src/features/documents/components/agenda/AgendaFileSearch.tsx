import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import clsx from 'clsx';
import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function AgendaFileSearch(props: {
  value: string;
  onChange: (value: string) => unknown;
  className?: string;
  disabled?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const debouncedChange = useDebouncedCallback(props.onChange, 600);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      debouncedChange(e.target.value);
    },
    [setSearch, debouncedChange],
  );

  const onSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && searchRef.current) searchRef.current.blur();
    },
    [searchRef],
  );

  return (
    <SearchBar
      className={props.className}
      renderInput={(inputProps) => (
        <input
          {...inputProps}
          disabled={props.disabled}
          ref={searchRef}
          autoComplete="off"
          className={clsx(inputProps.className, 'w-full')}
          onKeyDown={onSearchKeyDown}
          onChange={onChange}
          value={search}
        />
      )}
    />
  );
}
