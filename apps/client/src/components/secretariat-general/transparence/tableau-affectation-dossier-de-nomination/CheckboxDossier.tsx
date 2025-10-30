import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import type { FC } from 'react';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';

export type CheckboxDossierProps = {
  dossierId: string;
};

export const CheckboxDossier: FC<CheckboxDossierProps> = ({ dossierId }) => {
  const { selectedDossierIds, toggleDossierSelection } = useAffectation();

  return (
    <Checkbox
      options={[
        {
          label: '',
          nativeInputProps: {
            checked: selectedDossierIds.has(dossierId),
            onChange: () => toggleDossierSelection(dossierId)
          }
        }
      ]}
    />
  );
};
