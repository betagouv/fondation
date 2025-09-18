import { useState, useEffect, useRef } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { Magistrat } from 'shared-models';
import clsx from 'clsx';

export const FiltreFormation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleFormationChange = (formation: string, isChecked: boolean) => {
    setSelectedFormations((prev) => (isChecked ? [...prev, formation] : prev.filter((f) => f !== formation)));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        priority="tertiary no outline"
        className={clsx(
          'rounded-full transition-colors duration-200',
          selectedFormations.length > 0 ? 'bg-blue-700' : 'bg-blue-600'
        )}
        onClick={toggleDropdown}
        type="button"
      >
        <span>
          Formation
          {selectedFormations.length > 0 && (
            <span className="ml-1 text-xs">({selectedFormations.length})</span>
          )}
        </span>
        <span
          className={clsx(
            'fr-icon-arrow-down-s-line transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        ></span>
      </Button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg duration-200">
          <Checkbox
            legend="Checkboxes du filtre des formations"
            options={[
              {
                label: Magistrat.Formation.PARQUET,
                nativeInputProps: {
                  name: 'checkboxes-parquet',
                  value: Magistrat.Formation.PARQUET,
                  checked: selectedFormations.includes(Magistrat.Formation.PARQUET),
                  onChange: (e) => handleFormationChange(Magistrat.Formation.PARQUET, e.target.checked)
                }
              },
              {
                label: Magistrat.Formation.SIEGE,
                nativeInputProps: {
                  name: 'checkboxes-siege',
                  value: Magistrat.Formation.SIEGE,
                  checked: selectedFormations.includes(Magistrat.Formation.SIEGE),
                  onChange: (e) => handleFormationChange(Magistrat.Formation.SIEGE, e.target.checked)
                }
              }
            ]}
            state="default"
            stateRelatedMessage="State description"
          />
        </div>
      )}
    </div>
  );
};
