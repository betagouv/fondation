import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Button, type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import React from 'react';

export const MenuRoot = BaseMenu.Root;
export const MenuSeparator = BaseMenu.Separator;

export const MenuTrigger = React.memo((props: ButtonProps) => (
  <BaseMenu.Trigger
    nativeButton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render={(renderProps: any) => <Button {...renderProps} {...props} />}
  />
));

export const MenuContent = React.memo((props: React.PropsWithChildren) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner className="outline-none" sideOffset={8}>
      <BaseMenu.Popup
        className={clsx(
          'flex origin-[var(--transform-origin)] flex-col rounded-md border border-solid border-gray-300 bg-[canvas] shadow-lg',
          'transition-[transform,scale,opacity]',
          'data-[ending-style]:scale-90 data-[starting-style]:scale-90 data-[ending-style]:opacity-0',
          'data-[starting-style]:opacity-0'
        )}
      >
        {props.children}
      </BaseMenu.Popup>
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
));

export const MenuItem = React.memo((props: ButtonProps) => (
  <BaseMenu.Item
    nativeButton={!props.linkProps}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render={(renderProps: any, state) => (
      <Button
        priority="tertiary no outline"
        {...renderProps}
        {...props}
        data-highlighted={state.highlighted}
        disabled={state.disabled}
        className={clsx(
          'w-full',
          'first:data-[highlighted]:rounded-t-md',
          'last:data-[highlighted]:rounded-b-md',
          props.className
        )}
      >
        {props.children}
      </Button>
    )}
  />
));
