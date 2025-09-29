import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';
import { useEffect, useRef, useState, type FC } from 'react';

export interface DropdownSelectOption {
  value: string;
  label: string;
}

type DropdownSelectProps = {
  tagName: string;
  options: DropdownSelectOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  /** Force le positionnement fixed (utile pour les tableaux) */
  useFixedPositioning?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const DropdownSelect: FC<DropdownSelectProps> = ({
  tagName,
  options,
  selectedValues,
  onSelectionChange,
  useFixedPositioning = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const calculateSimplePosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8, // 8px de marge sous le bouton
      left: rect.left
    };
  };

  const toggleDropdown = () => {
    if (!isOpen && useFixedPositioning) {
      setDropdownPosition(calculateSimplePosition());
    }
    setIsOpen(!isOpen);
  };

  const onChangeHandler = (value: string, isChecked: boolean) => {
    const newSelection = isChecked ? [...selectedValues, value] : selectedValues.filter((v) => v !== value);
    onSelectionChange(newSelection);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (useFixedPositioning) {
        // Mode fixed : vérifier button + dropdown séparément
        if (
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      } else {
        // Mode relatif : comme avant
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleScroll = (event: Event) => {
      // Fermeture au scroll seulement en mode fixed
      if (
        useFixedPositioning &&
        isOpen &&
        dropdownRef.current &&
        event.target !== dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (useFixedPositioning) {
        document.addEventListener('scroll', handleScroll, { capture: true });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (useFixedPositioning) {
        document.removeEventListener('scroll', handleScroll, { capture: true });
      }
    };
  }, [isOpen, useFixedPositioning]);

  const checkboxOptions = options.map((option) => ({
    label: option.label,
    nativeInputProps: {
      name: `checkboxes-${option.value}`,
      value: option.value,
      checked: selectedValues.includes(option.value),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(option.value, e.target.checked)
    }
  }));

  const buttonElement = (
    <Button
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
          '--active': 'var(--background-action-low-blue-france-active)'
        } as React.CSSProperties
      }
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
  );

  const dropdownElement = isOpen && (
    <div
      ref={dropdownRef}
      className={clsx(
        'animate-in slide-in-from-top-2 max-h-[250px] min-w-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg duration-200',
        useFixedPositioning ? 'fixed z-[9999]' : 'absolute left-0 top-full z-50 mt-2'
      )}
      style={
        useFixedPositioning
          ? {
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }
          : undefined
      }
    >
      <Checkbox options={checkboxOptions} state="default" className="mb-0 mt-2" />
    </div>
  );

  return (
    <>
      <div className={clsx('relative', className)} ref={useFixedPositioning ? buttonRef : dropdownRef}>
        {buttonElement}
        {!useFixedPositioning && dropdownElement}
      </div>
      {useFixedPositioning && dropdownElement}
    </>
  );
};
