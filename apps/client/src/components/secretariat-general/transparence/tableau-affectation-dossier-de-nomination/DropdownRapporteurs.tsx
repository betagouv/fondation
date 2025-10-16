import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, useRef, useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';

export type InputAffectationProps = {
  dossierId: string;
  initialRapporteurs: string[];
  availableRapporteurs: UserDescriptorSerialized[];
};

export const DropdownRapporteurs: FC<InputAffectationProps> = ({
  dossierId,
  initialRapporteurs,
  availableRapporteurs
}) => {
  const { affectations, updateAffectation } = useAffectation();
  const selectedRapporteurs = affectations[dossierId] ?? initialRapporteurs;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Repositionner au scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen]);

  const toggleRapporteur = (userId: string) => {
    const newSelection = selectedRapporteurs.includes(userId)
      ? selectedRapporteurs.filter((id) => id !== userId)
      : [...selectedRapporteurs, userId];
    updateAffectation(dossierId, newSelection);
  };

  // Filtrer les rapporteurs selon la recherche
  const filteredRapporteurs = availableRapporteurs.filter((r) =>
    `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dropdownContent = isOpen && dropdownPosition && (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        zIndex: 9999
      }}
      className="max-h-96 min-w-[300px] overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
    >
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
    <>
      <div ref={buttonRef}>
        <Button
          priority="tertiary no outline"
          size="small"
          onClick={() => setIsOpen(!isOpen)}
          iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
          iconPosition="right"
          title="Sélectionner des rapporteurs"
        >
          {selectedRapporteurs.length > 0 ? `${selectedRapporteurs.length} sélectionné(s)` : 'Sélectionner'}
        </Button>
      </div>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};
