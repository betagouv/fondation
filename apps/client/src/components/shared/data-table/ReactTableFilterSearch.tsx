import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Input from '@codegouvfr/react-dsfr/Input';
import type { RowData, Table } from '@tanstack/react-table';
import clsx from 'clsx';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function ReactTableFilterSearch<Data extends RowData>(props: { table: Table<Data> }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState(props.table.getState().globalFilter);
  const updateGlobalFilter = useDebouncedCallback((globalFilter: string) => {
    if (globalFilter.length <= 3) props.table.setGlobalFilter(undefined);

    props.table.setGlobalFilter(globalFilter);
  }, 600);

  const focus = React.useCallback(() => {
    // @ts-expect-error this definitely exist
    inputRef.current?.focus({ focusVisible: true });
  }, [inputRef]);

  const onKeyPress = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.code === 'Enter' || e.code === 'Escape') && inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  if (!props.table.options.enableGlobalFilter) return null;

  return (
    <div className="flex items-center">
      <div className="peer-focus-within:hidden 2xl:hidden">
        <Button
          onClick={focus}
          title="recherche naturelle"
          iconId="fr-icon-search-line"
          className="rounded-full"
        />
        <p className="m-0 mt-2 text-xs text-gray-600">{search}</p>
      </div>

      <Input
        label=""
        classes={{
          message: '2xl:hidden',
          nativeInputOrTextArea: clsx(cx('fr-icon-search-line'), '2xl:mr-1 2xl:focus-within:mr-0'),
        }}
        className={clsx(
          'peer',
          'mb-0 w-0 rounded-full opacity-0',
          'focus-within:z-10 focus-within:rounded focus-within:bg-white focus-within:p-6 focus-within:opacity-100 focus-within:shadow',
          'focus-within:absolute focus-within:w-[40%] focus-within:overflow-visible',

          '2xl:mt-0 2xl:block 2xl:w-50 2xl:rounded-none 2xl:opacity-[initial] 2xl:focus-within:w-[30%]',
          '2xl:focus-within:z-[initial] 2xl:focus-within:rounded-none 2xl:focus-within:bg-none 2xl:focus-within:p-0 2xl:focus-within:shadow-none',
          '2xl:focus-within:relative 2xl:focus-within:w-[initial] 2xl:focus-within:overflow-visible',
        )}
        nativeInputProps={{
          type: 'search',
          ref: inputRef,
          value: search,
          autoComplete: 'off',
          placeholder: 'Rechercher',
          'aria-live': 'polite',
          onKeyDown: onKeyPress,
          onChange: (e) => {
            const value = String(e.target.value);
            setSearch(value);
            updateGlobalFilter(value);
          },
        }}
      />
    </div>
  );
}
