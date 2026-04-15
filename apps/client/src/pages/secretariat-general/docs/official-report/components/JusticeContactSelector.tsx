import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot
} from '@/components/shared/combobox';
import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { unaccent } from '@/utils/string.utils';
import { useCreateJusticeContactMutation, useFindJusticeContacts } from '@queries/agenda.queries';
import clsx from 'clsx';
import { useMonoSelection } from '../hooks/useSelection';

export function JusticeContactSelector(props: {
  value: string | null;
  onChange: (value: string | null) => unknown;
  label: React.ReactNode;
}) {
  const { $t } = useIntl();
  const confirmation = useConfirmation();
  const [search, setSearch] = React.useState('');

  const trimmed = search.trim();
  const { data, isFetching } = useFindJusticeContacts({ search: undefined });

  const items = React.useMemo(() => data?.items ?? [], [data]);

  const hasExact = React.useMemo(() => {
    const re = new RegExp('^' + unaccent(trimmed) + '$', 'i');
    return items.some((item) => re.test(unaccent(item.name)));
  }, [items, trimmed]);

  const viewItems = React.useMemo(
    () =>
      items
        .map((item) => ({ ...item, id: String(item.id), isCreatable: false }))
        .concat(trimmed && !hasExact ? [{ id: `create:${trimmed}`, name: trimmed, isCreatable: true }] : []),
    [items, hasExact, trimmed]
  );

  const onSelect = React.useCallback(
    (item: ViewItem | null) => {
      setSearch('');
      props.onChange(item?.id ?? null);
    },
    [setSearch, props]
  );

  const { selection, select } = useMonoSelection({
    onSelect,
    items: viewItems,
    defaultValueId: props.value
  });

  const { mutate: createJusticeContactMutation, isPending: isCreating } = useCreateJusticeContactMutation();
  const createJusticeContact = React.useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: $t({ defaultMessage: `Créer le contact DSJ\u00A0?` }),
      content: (
        <p>
          <FormattedMessage
            values={{ trimmed }}
            defaultMessage={`Le contact «\u00A0{trimmed}\u00A0» sera créé.`}
          />
        </p>
      )
    });

    if (!isConfirmed) return;

    createJusticeContactMutation(
      { name: trimmed },
      {
        onSuccess(created) {
          if (created) select(created.id);
        }
      }
    );
  }, [trimmed, confirmation, $t, createJusticeContactMutation, select]);

  const addTitle = React.useMemo(
    () => $t({ defaultMessage: `ajouter «\u00A0{trimmed}\u00A0»` }, { trimmed }),
    [trimmed, $t]
  );

  return (
    <ComboboxRoot
      multiple={false}
      items={viewItems}
      inputValue={search}
      value={selection}
      onValueChange={select}
      onInputValueChange={setSearch}
      itemToStringLabel={(value: ViewItem) => value.name}
    >
      <ComboboxInput label={props.label} />

      <ComboboxContent>
        <ComboboxEmpty>
          <FormattedMessage defaultMessage={`Créer à la volée`} />
        </ComboboxEmpty>

        <ComboboxList>
          {(item: ViewItem) =>
            item.isCreatable ? (
              <ComboboxItem
                nativeButton
                value={item}
                key={item.id}
                render={(itemProps) => (
                  <Button
                    {...itemProps}
                    nativeButtonProps={confirmation.buttonProps}
                    priority="tertiary no outline"
                    onClick={createJusticeContact}
                    disabled={isFetching || isCreating}
                    className={clsx(
                      'w-full first:rounded-t-none last:rounded-b-md',
                      `first:data-[highlighted]:rounded-t-none`,
                      `data-[highlighted]:bg-[#f6f6f6] data-[highlighted]:hover:outline-0`,
                      `data-[highlighted]:outline data-[highlighted]:outline-2`,
                      `data-[highlighted]:outline-offset-2 data-[highlighted]:outline-blue-500`,
                      {
                        'before:size-4 before:animate-spin before:content-[""]': isFetching || isCreating
                      }
                    )}
                    title={addTitle}
                    iconId={isFetching ? 'ri-loader-4-line' : 'fr-icon-add-line'}
                  >
                    «&nbsp;{trimmed}&nbsp;»
                  </Button>
                )}
              />
            ) : (
              <ComboboxItem key={item.id} value={item}>
                {item.name}
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}

type ViewItem = { id: string; name: string; isCreatable: boolean };
