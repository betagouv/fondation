import { Button } from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React, { useState, type PropsWithChildren } from 'react';
import { DropdownMenu } from './DropdownMenu';

export type DropdownSelectMultipleProps<T> = {
  renderItem?: (item: T) => React.ReactNode;
  items: T[];
  value?: T[];
  onChange?: (value: T[]) => unknown;
  title?: string;

  className?: string;
  disabled?: boolean;

  buttonProps?: {
    priority?: 'primary' | 'secondary' | 'tertiary' | 'tertiary no outline';
    size?: 'small' | 'medium' | 'large';
  };
} & (T extends string | number
  ? { itemToString?: (value: T) => string }
  : { itemToString: (value: T) => string });

export function DropdownSelectMultiple<T>(props: PropsWithChildren<DropdownSelectMultipleProps<T>>) {
  const [isOpen, setIsOpen] = useState(false);

  const getKey = React.useCallback((value: T): unknown => props.itemToString?.(value) ?? value, [props]);
  const [itemsMap, setItemsMap] = React.useState(
    () =>
      new Map<unknown, T>(
        (props.value ?? []).map((item) => [props.itemToString?.(item) ?? item, item] as const)
      )
  );

  React.useEffect(() => {
    setItemsMap(
      new Map<unknown, T>(
        (props.value ?? []).map((item) => [props.itemToString?.(item) ?? item, item] as const)
      )
    );
  }, [props, setItemsMap]);

  const select = React.useCallback(
    (key: unknown, value: T) => {
      if (itemsMap.has(key)) {
        itemsMap.delete(key);
      } else {
        itemsMap.set(key, value);
      }

      setItemsMap(new Map(itemsMap));
      props.onChange?.(Array.from(itemsMap.values()));
    },
    [props, itemsMap, setItemsMap]
  );

  const trigger = (
    <div className={props.className}>
      <Button
        disabled={props.disabled}
        priority={props.buttonProps?.priority}
        size={props.buttonProps?.size}
        iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
        iconPosition="right"
        title={props.title}
      >
        {props.children}
      </Button>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} isOpen={isOpen} onOpenChange={setIsOpen}>
      <div className="max-h-64 min-w-[200px] overflow-hidden border border-solid border-gray-100 bg-white p-2 shadow-lg">
        <Checkbox
          small
          classes={{
            content: 'm-0',
            inputGroup: 'hover:bg-gray-100 pr-2 pl-4 py-0 first-of-type:!mt-0',
            root: 'border border-gray-50 overflow-y-auto m-0'
          }}
          options={props.items.map((item, i) => {
            const key = getKey(item);
            return {
              hintText: undefined,
              label: props.renderItem?.(item) ?? props.itemToString?.(item) ?? String(item),
              nativeInputProps: {
                className: i === 0 ? 'mt-0' : undefined,
                checked: itemsMap.has(key),
                onChange: () => select(key, item),
                value: key as string
              }
            };
          })}
        />
      </div>
    </DropdownMenu>
  );
}
