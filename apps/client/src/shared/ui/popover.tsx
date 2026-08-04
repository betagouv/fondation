import { Popover as BasePopover } from '@base-ui/react/popover';
import { Button, type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import React from 'react';

export const PopoverRoot = BasePopover.Root;

export const PopoverTrigger = React.memo((props: ButtonProps) => (
  <BasePopover.Trigger
    nativeButton
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    render={(renderProps: any) => <Button {...renderProps} {...props} />}
  />
));

export const PopoverContent = React.memo((props: React.PropsWithChildren<{ className?: string }>) => (
  <BasePopover.Portal>
    <BasePopover.Positioner align="start" className="z-10 outline-hidden" sideOffset={8}>
      <BasePopover.Popup
        className={clsx(
          'fr-p-3v flex origin-(--transform-origin) flex-col rounded-md border border-solid border-(--border-default-grey) bg-[canvas] shadow-lg',
          'transition-[transform,scale,opacity]',
          'data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90',
          'data-starting-style:opacity-0',
          props.className,
        )}
      >
        {props.children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  </BasePopover.Portal>
));
