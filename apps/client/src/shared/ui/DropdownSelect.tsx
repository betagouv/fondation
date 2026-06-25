import { Button } from '@codegouvfr/react-dsfr/Button';
import React, { useState, type FC } from 'react';

import { DropdownMenu } from './DropdownMenu';

export interface DropdownSelectOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  selected?: React.ReactNode;
}

export interface DropdownSelectProps<T extends string = string> {
  options: DropdownSelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  buttonPriority?: 'primary' | 'secondary' | 'tertiary' | 'tertiary no outline';
  buttonSize?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
}

export const DropdownSelect = <T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner',
  buttonPriority = 'tertiary no outline',
  buttonSize = 'small',
  className,
  disabled,
}: DropdownSelectProps<T>): ReturnType<FC> => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const trigger = (
    <div className={className}>
      <Button
        disabled={disabled}
        priority={buttonPriority}
        size={buttonSize}
        iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
        iconPosition="right"
      >
        {selectedOption ? (selectedOption.selected ?? selectedOption.label) : placeholder}
      </Button>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} isOpen={isOpen} onOpenChange={setIsOpen}>
      <div className="w-max overflow-hidden rounded-sm border border-(--border-default-grey) bg-[canvas] shadow-lg">
        <div className="fr-py-1v flex max-h-64 flex-col gap-1 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              className={`fr-px-4v fr-py-2v rounded text-left hover:bg-(--background-default-grey-hover) ${
                value === option.value ? 'bg-(--background-open-blue-france) font-semibold' : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </DropdownMenu>
  );
};
