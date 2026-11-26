import DsfrToggleSwitch, { type ToggleSwitchProps } from '@codegouvfr/react-dsfr/ToggleSwitch';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';

/** before: rewrites the content where the DSFR writes the status so a switch that shows it keeps the DSFR look */
const WITHOUT_STATUS = '[&_label]:before:mt-0.5 [&_label]:after:top-0.5';
const WITHOUT_STATUS_LABEL_ON_THE_RIGHT = '[&_label]:before:mr-3';
const SMALL = clsx(
  '[&_input]:top-1 [&_input]:h-4 [&_input]:w-8',
  '[&_label]:w-auto [&_label]:text-sm [&_label]:whitespace-nowrap',
  '[&_label]:before:mt-1 [&_label]:before:mr-1.5 [&_label]:before:h-4 [&_label]:before:max-w-8 [&_label]:before:min-w-8 [&_label]:before:bg-[length:100%_100%] [&_label]:before:pt-4',
  '[&_label]:after:top-1 [&_label]:after:size-4 [&_label]:after:bg-[length:0.75rem]',
);

/** the DSFR one points its input at a hint even without one, which leaves the description dangling */
export function ToggleSwitch({
  small,
  ...props
}: ToggleSwitchProps & {
  small?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasHint = props.helperText !== undefined;
  const withoutStatus = props.showCheckedHint === false;

  useLayoutEffect(() => {
    if (!hasHint) ref.current?.querySelector('input')?.removeAttribute('aria-describedby');
  }, [hasHint]);

  return (
    <DsfrToggleSwitch
      ref={ref}
      {...props}
      className={clsx(
        props.className,
        small
          ? SMALL
          : withoutStatus && [
              WITHOUT_STATUS,
              props.labelPosition !== 'left' && WITHOUT_STATUS_LABEL_ON_THE_RIGHT,
            ],
      )}
    />
  );
}
