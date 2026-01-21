import { Select } from '@codegouvfr/react-dsfr/Select';
import type { FC } from 'react';
import { PrioriteEnum, PrioriteLabels } from 'shared-models/models/priorite.enum';
import type { PrioriteValue } from '../../../../contexts/AffectationDossiersContext';

export type SelectPrioriteProps = {
  selectedPriorite: PrioriteValue;
  onPrioriteChange: (priorite: PrioriteValue) => void;
};

const EMPTY_VALUE = '__EMPTY__' as const;
const NO_CHANGE_VALUE = '__NO_CHANGE__' as const;

export const SelectPriorite: FC<SelectPrioriteProps> = ({ selectedPriorite, onPrioriteChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === EMPTY_VALUE) {
      onPrioriteChange(null);
    } else if (value !== NO_CHANGE_VALUE) {
      onPrioriteChange(value as PrioriteEnum);
    }
  };

  const currentValue = selectedPriorite === undefined ? NO_CHANGE_VALUE : (selectedPriorite ?? EMPTY_VALUE);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <Select
          label=""
          nativeSelectProps={{
            value: currentValue,
            onChange: handleChange
          }}
        >
          <option value={NO_CHANGE_VALUE}>Ne pas modifier</option>
          <option value={EMPTY_VALUE}>Aucune priorité</option>
          {Object.values(PrioriteEnum).map((priorite) => (
            <option key={priorite} value={priorite}>
              {PrioriteLabels[priorite]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};
