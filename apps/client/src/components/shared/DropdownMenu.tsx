import { useState, useRef, useEffect, useCallback, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type DropdownMenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export const DropdownMenu: FC<DropdownMenuProps> = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  disabled = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mode contrôlé ou non contrôlé
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = useCallback(
    (value: boolean) => {
      if (disabled) return;
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(value);
      }
      onOpenChange?.(value);
    },
    [disabled, controlledIsOpen, onOpenChange]
  );

  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est stable
      requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    }
  }, [isOpen]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

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

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
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
      className={className}
    >
      {children}
    </div>
  );

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};
