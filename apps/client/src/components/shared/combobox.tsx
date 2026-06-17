import {
  Combobox as BaseCombobox,
  type ComboboxInputProps,
  type ComboboxItemProps,
} from '@base-ui/react/combobox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import * as React from 'react';

export const ComboboxRoot = BaseCombobox.Root;
export const ComboboxList = BaseCombobox.List;
export type ComboboxChangeEventDetails = BaseCombobox.Root.ChangeEventDetails;

export function ComboboxInputGroup(props: React.PropsWithChildren) {
  return (
    <BaseCombobox.InputGroup
      className={clsx(
        'fr-py-1v w-64 cursor-text rounded-md border border-gray-200 bg-[canvas] px-1.5',
        'focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-blue-france-sun-113',
        'min-[500px]:w-88',
      )}
    >
      {props.children}
    </BaseCombobox.InputGroup>
  );
}

export function ComboboxInput({
  label,
  className,
  ...props
}: Omit<ComboboxInputProps, 'render'> & { label: React.ReactNode }) {
  return (
    <BaseCombobox.Input
      {...props}
      render={(inputProps) => (
        <Input
          label={label}
          nativeInputProps={
            inputProps as unknown as React.DetailedHTMLProps<
              React.InputHTMLAttributes<HTMLInputElement>,
              HTMLInputElement
            >
          }
        />
      )}
      className={clsx(
        `fr-pl-2v h-8 min-w-12 flex-1 rounded-md border-0 bg-transparent`,
        `text-base font-normal text-gray-900 outline-hidden`,
        className,
      )}
    />
  );
}

export function ComboboxEmpty(props: React.PropsWithChildren) {
  const children = props.children;
  return (
    <BaseCombobox.Empty>
      {typeof children === 'string' ? (
        <div className="fr-p-4v text-center text-xs text-gray-500">{children}</div>
      ) : (
        children
      )}
    </BaseCombobox.Empty>
  );
}

export function ComboboxContent(props: React.PropsWithChildren) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner className="z-50 outline-hidden" sideOffset={8}>
        <BaseCombobox.Popup
          className={clsx(
            'flex origin-(--transform-origin) flex-col rounded-md border border-solid border-gray-300 bg-[canvas] shadow-lg first:rounded-t-none',
            'transition-[transform,scale,opacity]',
            'data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90',
            'data-starting-style:opacity-0',
            'max-h-[min(var(--available-height),24rem)] w-(--anchor-width) max-w-(--available-width)',
            'data-empty:py-4 data-empty:pr-2 data-empty:pl-4',
          )}
        >
          {props.children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return (
    <BaseCombobox.Item
      {...props}
      className={clsx(
        `fr-p-3v text-base leading-4 outline-hidden`,
        // `grid cursor-default select-none grid-cols-[0.75rem_1fr] items-center gap-2 fr-py-2v fr-pl-4v fr-pr-8v`,
        `data-highlighted:relative data-highlighted:z-0`,
        `data-highlighted:before:absolute data-highlighted:before:inset-0`,
        `cursor-pointer data-highlighted:before:content-[""]`,
        `data-highlighted:outline-2 data-highlighted:outline-blue-500 data-highlighted:hover:outline-0`,
        `last:rounded-b-md data-highlighted:outline-offset-2 first:data-highlighted:rounded-t-none`,
        `data-highlighted:before:z-[-1] data-highlighted:before:bg-[#f6f6f6] last:data-highlighted:before:rounded-b-md`,
        className,
      )}
    />
  );
}
