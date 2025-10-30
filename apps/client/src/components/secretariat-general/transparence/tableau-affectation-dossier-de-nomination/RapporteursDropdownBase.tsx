import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { DropdownMenu } from '../../../shared/DropdownMenu';

export type RapporteursDropdownBaseProps = {
  availableRapporteurs: UserDescriptorSerialized[];
  selectedRapporteurs: string[];
  onSelectionChange: (rapporteurIds: string[]) => void;
  buttonLabel: string;
};

export const RapporteursDropdownBase: FC<RapporteursDropdownBaseProps> = ({
  availableRapporteurs,
  selectedRapporteurs,
  onSelectionChange,
  buttonLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRapporteur = (userId: string) => {
    const newSelection = selectedRapporteurs.includes(userId)
      ? selectedRapporteurs.filter((id) => id !== userId)
      : [...selectedRapporteurs, userId];
    onSelectionChange(newSelection);
  };

  // Filtrer les rapporteurs selon la recherche
  const filteredRapporteurs = availableRapporteurs.filter((r) =>
    `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trigger = (
    <Button
      priority="tertiary no outline"
      size="small"
      iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
      iconPosition="right"
      title="Sélectionner des rapporteurs"
    >
      {buttonLabel}
    </Button>
  );

  const content = (
    <div className="max-h-96 min-w-[300px] overflow-hidden rounded border border-gray-300 bg-white shadow-lg">
      <div className="border-b border-gray-200 p-4">
        <Input
          label=""
          nativeInputProps={{
            placeholder: 'Rechercher un rapporteur...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            type: 'text'
          }}
        />
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto p-4">
        {filteredRapporteurs.length > 0 ? (
          filteredRapporteurs.map((rapporteur) => (
            <Checkbox
              key={rapporteur.userId}
              options={[
                {
                  label: `${rapporteur.lastName} ${rapporteur.firstName}`,
                  nativeInputProps: {
                    checked: selectedRapporteurs.includes(rapporteur.userId),
                    onChange: () => toggleRapporteur(rapporteur.userId)
                  }
                }
              ]}
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">Aucun rapporteur trouvé</p>
        )}
      </div>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} isOpen={isOpen} onOpenChange={setIsOpen}>
      {content}
    </DropdownMenu>
  );
};
