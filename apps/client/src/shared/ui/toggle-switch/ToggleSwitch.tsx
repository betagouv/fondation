import DsfrToggleSwitch, { type ToggleSwitchProps } from '@codegouvfr/react-dsfr/ToggleSwitch';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';

/** before: rewrites the content where the DSFR writes the status so a switch that shows it keeps the DSFR look */
const WITHOUT_STATUS = '[&_label]:before:mt-0.5 [&_label]:after:top-0.5';
const WITHOUT_STATUS_LABEL_ON_THE_RIGHT = '[&_label]:before:mr-3';

/** the DSFR one points its input at a hint even without one: the dangling description goes */
export function ToggleSwitch(props: ToggleSwitchProps) {
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
        withoutStatus && [
          WITHOUT_STATUS,
          props.labelPosition !== 'left' && WITHOUT_STATUS_LABEL_ON_THE_RIGHT,
        ],
      )}
    />
  );
}
