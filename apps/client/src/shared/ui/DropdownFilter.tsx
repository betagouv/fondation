import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';
import { useEffect, useRef, useState, type FC } from 'react';

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
  className,
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
    label: <span className="text-sm">{option.label}</span>,
    nativeInputProps: {
      name: `checkboxes-${option.value}`,
      value: option.value,
      checked: selectedValues.includes(option.value),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(option.value, e.target.checked),
    },
  }));

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <Button
        size="small"
        priority="secondary"
        className={clsx('rounded-full transition-colors duration-200')}
        style={
          {
            color: 'var(--text-action-high-blue-france)',
            backgroundColor: 'var(--background-action-low-blue-france)',
            outline: 'none',
            boxShadow: 'none',
            '--idle': 'transparent',
            '--hover': 'var(--background-action-low-blue-france-hover)',
            '--active': 'var(--background-action-low-blue-france-active)',
          } as React.CSSProperties
        }
        nativeButtonProps={{ 'aria-expanded': isOpen, 'aria-haspopup': 'true' }}
        onClick={toggleDropdown}
        type="button"
      >
        <span>
          {tagName}
          {selectedValues.length > 0 && <span className="fr-ml-1v text-xs">({selectedValues.length})</span>}
        </span>
        <span
          className={clsx(
            'fr-icon-arrow-down-s-line transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        ></span>
      </Button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 fr-mt-2v fr-p-4v absolute top-full left-0 z-50 max-h-[250px] min-w-[230px] overflow-y-auto rounded-lg border border-(--border-default-grey) bg-(--background-default-grey) shadow-lg duration-200">
          <Checkbox options={checkboxOptions} state="default" className="fr-mt-2v fr-mb-0" small />
        </div>
      )}
    </div>
  );
};
