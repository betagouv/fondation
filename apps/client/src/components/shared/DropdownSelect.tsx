import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState, type FC } from 'react';
import { DropdownMenu } from './DropdownMenu';

export interface DropdownSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface DropdownSelectProps<T extends string = string> {
  options: DropdownSelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  buttonPriority?: 'primary' | 'secondary' | 'tertiary' | 'tertiary no outline';
  buttonSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export const DropdownSelect = <T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner',
  buttonPriority = 'tertiary no outline',
  buttonSize = 'small',
  className
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
        priority={buttonPriority}
        size={buttonSize}
        iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
        iconPosition="right"
        title={placeholder}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </Button>
    </div>
  );

  const content = (
    <div className="min-w-[200px] overflow-hidden rounded border border-gray-300 bg-white shadow-lg">
      <div className="max-h-64 space-y-1 overflow-y-auto p-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full rounded px-4 py-2 text-left hover:bg-gray-100 ${
              value === option.value ? 'bg-blue-50 font-semibold' : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} isOpen={isOpen} onOpenChange={setIsOpen}>
      {content}
    </DropdownMenu>
  );
};
