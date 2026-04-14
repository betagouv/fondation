import React from 'react';

export function Mandatory(props: React.PropsWithChildren) {
  return (
    <React.Fragment>
      {props.children}
      <span className="text-red-500">*</span>:
    </React.Fragment>
  );
}
