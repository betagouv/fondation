import clsx from 'clsx';
import type React from 'react';

export function PermanentBanner(
  props: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>
) {
  return (
    <p
      className={clsx('mb-0 flex h-10 w-full items-center justify-center text-sm', props.className)}
      style={props.style}
    >
      {props.children}
    </p>
  );
}
