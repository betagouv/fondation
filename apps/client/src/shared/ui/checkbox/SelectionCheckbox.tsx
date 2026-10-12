import './SelectionCheckbox.css';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import type { ChangeEventHandler } from 'react';

export function SelectionCheckbox(props: {
  ariaLabel: string;
  checked: boolean;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  value: string;
}) {
  return (
    <Checkbox
      className="fr-mb-0 selection-checkbox"
      options={[
        {
          label: '',
          nativeInputProps: {
            'aria-label': props.ariaLabel,
            checked: props.checked,
            disabled: props.disabled,
            onChange: props.onChange,
            value: props.value,
          },
        },
      ]}
    />
  );
}
