import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useController, type UseControllerProps } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { useMonoSelection } from '@/features/documents/hooks/useSelection';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot,
  type ComboboxChangeEventDetails,
} from '@/shared/ui/combobox';
import { unaccent } from '@/utils/string.utils';
import { useCreateJusticeContactMutation, useFindJusticeContacts } from '@queries/agenda.queries';

export function JusticeContactSelector(
  props: UseControllerProps<{ justiceContactId: string; [x: string]: unknown }, 'justiceContactId'> & {
    label: ReactNode;
    defaultValueId?: string | null;
  },
) {
  const { field } = useController(props);
  const { $t } = useIntl();
  const confirmation = useConfirmModal();
  const [search, setSearch] = useState('');

  const trimmed = search.trim();
  const { data, isFetching } = useFindJusticeContacts({ search: undefined });

  const items = useMemo(() => data?.items ?? [], [data]);

  const hasExact = useMemo(() => {
    const re = new RegExp('^' + unaccent(trimmed) + '$', 'i');
    return items.some((item) => re.test(unaccent(item.name)));
  }, [items, trimmed]);

  const viewItems = useMemo(
    () =>
      items
        .map((item) => ({ ...item, id: String(item.id), isCreatable: false }))
        .concat(trimmed && !hasExact ? [{ id: `create:${trimmed}`, name: trimmed, isCreatable: true }] : []),
    [items, hasExact, trimmed],
  );

  const onSelect = useCallback(
    (item: ViewItem | null) => {
      setSearch(item?.name ?? '');
      field.onChange(item?.id ?? null);
    },
    [field],
  );

  const { selection, select } = useMonoSelection({
    onSelect,
    items: viewItems,
    defaultValueId: props.defaultValueId,
  });

  useEffect(() => {
    if (!field.value) return;
    if (!selection || selection.id !== field.value) select(field.value);
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [field.value, select]);

  const { mutate: createJusticeContactMutation, isPending: isCreating } = useCreateJusticeContactMutation();
  const createJusticeContact = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: $t({ defaultMessage: `Créer le contact DSJ\u00A0?` }),
      content: (
        <p>
          <FormattedMessage
            defaultMessage={`Le contact «\u00A0{trimmed}\u00A0» sera créé.`}
            values={{ trimmed }}
          />
        </p>
      ),
    });

    if (!isConfirmed) return;

    createJusticeContactMutation(
      { name: trimmed },
      {
        onSuccess(created) {
          if (created) select(created.id);
        },
      },
    );
  }, [trimmed, confirmation, $t, createJusticeContactMutation, select]);

  const onValueChange = useCallback(
    (item: ViewItem | null, details: ComboboxChangeEventDetails) => {
      if (details.reason === 'input-clear') return;
      if (item?.isCreatable) return createJusticeContact();
      select(item);
    },
    [createJusticeContact, select],
  );

  const addTitle = useMemo(
    () => $t({ defaultMessage: `ajouter «\u00A0{trimmed}\u00A0»` }, { trimmed }),
    [trimmed, $t],
  );

  return (
    <ComboboxRoot
      inputValue={search}
      items={viewItems}
      itemToStringLabel={(value: ViewItem) => value.name}
      multiple={false}
      onInputValueChange={setSearch}
      onValueChange={onValueChange}
      value={selection}
    >
      <ComboboxInput label={props.label} />

      <ComboboxContent>
        <ComboboxEmpty>
          <span className="text-[0.925rem] text-(--text-mention-grey) italic">
            <FormattedMessage defaultMessage={`Pas de représentant existant (en attente d'une saisie)`} />
          </span>
        </ComboboxEmpty>

        <ComboboxList>
          {(item: ViewItem) =>
            item.isCreatable ? (
              <ComboboxItem
                key={item.id}
                nativeButton
                render={(itemProps) => (
                  <Button
                    {...itemProps}
                    priority="tertiary no outline"
                    disabled={isFetching || isCreating}
                    className={clsx(
                      'w-full first:rounded-t-none last:rounded-b-md',
                      `first:data-highlighted:rounded-t-none`,
                      `data-highlighted:bg-(--background-default-grey-hover) data-highlighted:hover:outline-0`,
                      `data-highlighted:outline-2 data-highlighted:outline-solid`,
                      `data-highlighted:outline-offset-2 data-highlighted:outline-(--border-active-blue-france)`,
                      {
                        'before:size-4! before:animate-spin before:content-[""]': isFetching || isCreating,
                      },
                    )}
                    title={addTitle}
                    iconId={isFetching ? 'ri-loader-4-line' : 'fr-icon-add-line'}
                  >
                    «&nbsp;{trimmed}&nbsp;»
                  </Button>
                )}
                value={item}
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
