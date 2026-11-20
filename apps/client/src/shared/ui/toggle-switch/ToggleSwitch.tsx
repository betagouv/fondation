import DsfrToggleSwitch, { type ToggleSwitchProps } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useLayoutEffect, useRef } from 'react';

/** the DSFR one points its input at a hint even without one, which leaves the description dangling */
export function ToggleSwitch(props: ToggleSwitchProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasHint = props.helperText !== undefined;

  useLayoutEffect(() => {
    if (!hasHint) ref.current?.querySelector('input')?.removeAttribute('aria-describedby');
  }, [hasHint]);

  return <DsfrToggleSwitch ref={ref} {...props} />;
}
