import React from 'react';

export function Mandatory(props: React.PropsWithChildren) {
  return (
    <React.Fragment>
      {props.children}
      <span className="text-(--text-default-error)">*</span>:
    </React.Fragment>
  );
}
