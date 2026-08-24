import type { PropsWithChildren } from 'react';

export function RequiredLabel(props: PropsWithChildren) {
  return (
    <>
      {props.children}
      <span className="text-(--text-default-error)">&nbsp;*</span>
    </>
  );
}
