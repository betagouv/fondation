import { PrioriteEnumLabels, type PrioriteEnum } from '@/types/enums.types';
import { Select } from '@codegouvfr/react-dsfr/Select';

import { NO_PRIORITY, type NoPriority } from '../contexts/files-affectations.context';

const NO_CHANGE_VALUE = '__NO_CHANGE__' as const;

export const NominationFilesPrioritySelector = (props: {
  selectedPriorite: PrioriteEnum | NoPriority | undefined;
  onPrioriteChange: (value: PrioriteEnum | NoPriority) => unknown;
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value !== NO_CHANGE_VALUE) {
      props.onPrioriteChange(value as PrioriteEnum | NoPriority);
    }
  };

  const currentValue =
    props.selectedPriorite === undefined ? NO_CHANGE_VALUE : (props.selectedPriorite ?? NO_PRIORITY);

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
          <option value={NO_PRIORITY}>Aucune priorité</option>

          {Object.entries(PrioriteEnumLabels).map(([priority, label]) => (
            <option key={priority} value={priority}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};
