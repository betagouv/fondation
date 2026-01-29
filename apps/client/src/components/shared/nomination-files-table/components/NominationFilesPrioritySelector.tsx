import { PrioriteEnumLabels, type PrioriteEnum } from '@/types/enums.types';
import { Select } from '@codegouvfr/react-dsfr/Select';

const EMPTY_VALUE = '__EMPTY__' as const;
const NO_CHANGE_VALUE = '__NO_CHANGE__' as const;

export const NominationFilesPrioritySelector = (props: {
  selectedPriorite: PrioriteEnum | null | undefined;
  onPrioriteChange: (value: PrioriteEnum | null) => unknown;
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === EMPTY_VALUE) {
      props.onPrioriteChange(null);
    } else if (value !== NO_CHANGE_VALUE) {
      props.onPrioriteChange(value as PrioriteEnum);
    }
  };

  const currentValue =
    props.selectedPriorite === undefined ? NO_CHANGE_VALUE : (props.selectedPriorite ?? EMPTY_VALUE);

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
