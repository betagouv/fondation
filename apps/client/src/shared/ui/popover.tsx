import { Popover as BasePopover } from '@base-ui/react/popover';
import Badge from '@codegouvfr/react-dsfr/Badge';
import { Button, type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { memo, type PropsWithChildren, type ReactNode } from 'react';

export const PopoverRoot = BasePopover.Root;

export const PopoverTrigger = memo((props: ButtonProps) => (
  <BasePopover.Trigger
    nativeButton
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    render={(renderProps: any) => <Button {...renderProps} {...props} />}
  />
));

export const PopoverContent = memo((props: PropsWithChildren<{ className?: string }>) => (
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

export function CountedPopover(props: { children: ReactNode; count: number; label: ReactNode }) {
  return (
    <PopoverRoot>
      <PopoverTrigger priority="tertiary no outline" size="small">
        {props.label}
        <Badge as="span" className="fr-ml-2v" noIcon small>
          {props.count}
        </Badge>
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </PopoverTrigger>

      <PopoverContent className="max-h-96 w-96 overflow-y-auto">{props.children}</PopoverContent>
    </PopoverRoot>
  );
}

export function EmptyPanel(props: { children: ReactNode }) {
  return <p className="fr-m-0 text-sm text-(--text-mention-grey)">{props.children}</p>;
}
