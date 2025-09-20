import { useState, useEffect, useRef, type FC } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';

export interface FilterOption {
  value: string;
  label: string;
}

export interface DropdownFilterProps {
  tagName: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  className?: string;
}

export const DropdownFilter: FC<DropdownFilterProps> = ({
  tagName,
  options,
  selectedValues,
  onSelectionChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const onChangeHandler = (value: string, isChecked: boolean) => {
    const newSelection = isChecked ? [...selectedValues, value] : selectedValues.filter((v) => v !== value);
    onSelectionChange(newSelection);
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

  const checkboxOptions = options.map((option) => ({
    label: option.label,
    nativeInputProps: {
      name: `checkboxes-${option.value}`,
      value: option.value,
      checked: selectedValues.includes(option.value),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(option.value, e.target.checked)
    }
  }));

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <Button
        priority="secondary"
        className={clsx('rounded-full transition-colors duration-200')}
        onClick={toggleDropdown}
        type="button"
      >
        <span>
          {tagName}
          {selectedValues.length > 0 && <span className="ml-1 text-xs">({selectedValues.length})</span>}
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
          <Checkbox options={checkboxOptions} state="default" className="mb-0 mt-2" />
        </div>
      )}
    </div>
  );
};
