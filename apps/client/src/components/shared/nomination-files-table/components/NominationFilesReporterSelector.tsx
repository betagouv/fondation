import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, type FC } from 'react';

export type SelectMultipleRapporteursProps = {
  availableRapporteurs: { userId: string; lastName: string; firstName: string }[];
  selectedRapporteurs: string[];
  onSelectionChange: (rapporteurIds: string[]) => void;
};

export const NominationFilesReporterSelector: FC<SelectMultipleRapporteursProps> = ({
  availableRapporteurs,
  selectedRapporteurs,
  onSelectionChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRapporteur = (userId: string) => {
    const newSelection = selectedRapporteurs.includes(userId)
      ? selectedRapporteurs.filter((id) => id !== userId)
      : [...selectedRapporteurs, userId];
    onSelectionChange(newSelection);
  };

  const filteredRapporteurs = availableRapporteurs
    .filter((r) => `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <Input
          label=""
          nativeInputProps={{
            placeholder: 'Rechercher un rapporteur...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            type: 'text',
          }}
        />
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto p-4">
        {filteredRapporteurs.length > 0 ? (
          filteredRapporteurs.map((rapporteur) => (
            <Checkbox
              key={rapporteur.userId}
              options={[
                {
                  label: `${rapporteur.lastName} ${rapporteur.firstName}`.toUpperCase(),
                  nativeInputProps: {
                    checked: selectedRapporteurs.includes(rapporteur.userId),
                    onChange: () => toggleRapporteur(rapporteur.userId),
                  },
                },
              ]}
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">Aucun rapporteur trouvé</p>
        )}
      </div>
    </div>
  );
};
