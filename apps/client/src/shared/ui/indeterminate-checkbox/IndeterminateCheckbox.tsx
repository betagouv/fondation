import './IndeterminateCheckbox.css';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';

export function IndeterminateCheckbox(
  props: React.PropsWithChildren<{
    checked: boolean;
    indeterminate: boolean;
    small: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }>,
) {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = props.checked && props.indeterminate;
    }
  }, [checkboxRef, props.indeterminate, props.checked]);

  return (
    <Checkbox
      small={props.small}
      options={[
        {
          label: props.children,
          nativeInputProps: {
            checked: props.checked,
            onChange: props.onChange,
            ref: checkboxRef,
          },
        },
      ]}
    ></Checkbox>
  );
}
