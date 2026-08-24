import type { PropsWithChildren } from 'react';

export function Mandatory(props: PropsWithChildren) {
  return (
    <>
      {props.children}
      <span className="text-(--text-default-error)">&nbsp;*</span>
    </>
  );
}
