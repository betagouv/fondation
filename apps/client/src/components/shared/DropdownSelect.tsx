import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState, useRef, useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';

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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && dropdownPosition && (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        zIndex: 9999
      }}
      className="min-w-[200px] overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
    >
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
    <>
      <div ref={buttonRef} className={className}>
        <Button
          priority={buttonPriority}
          size={buttonSize}
          onClick={() => setIsOpen(!isOpen)}
          iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
          iconPosition="right"
          title={placeholder}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Button>
      </div>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};
