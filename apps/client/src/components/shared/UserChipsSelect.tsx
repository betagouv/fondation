import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, useRef, useEffect, useMemo, type FC } from 'react';
import { createPortal } from 'react-dom';

export type User = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type UserChipsSelectProps = {
  availableUsers: User[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  placeholder?: string;
  label?: string;
};

export const UserChipsSelect: FC<UserChipsSelectProps> = ({
  availableUsers,
  selectedUserIds,
  onSelectionChange,
  placeholder = 'Rechercher et ajouter des utilisateurs...',
  label,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = useMemo(
    () =>
      availableUsers
        .filter((u) => !selectedUserIds.includes(u.userId))
        .filter(
          (u) =>
            searchTerm === '' ||
            `${u.lastName} ${u.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .slice(0, 10),
    [availableUsers, selectedUserIds, searchTerm],
  );

  const selectedUsers = useMemo(
    () => availableUsers.filter((u) => selectedUserIds.includes(u.userId)),
    [availableUsers, selectedUserIds],
  );

  const addUser = (event: React.MouseEvent, userId: string) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectionChange([...selectedUserIds, userId]);
    setSearchTerm('');
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter((id) => id !== userId));
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.length > 0);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-2 block text-sm font-medium">{label}</label>}

      {selectedUsers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              <span>
                {user.firstName} {user.lastName}
              </span>
              <button
                type="button"
                onClick={() => removeUser(user.userId)}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-200"
                aria-label={`Retirer ${user.firstName} ${user.lastName}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          label=""
          nativeInputProps={{
            ref: inputRef,
            placeholder,
            value: searchTerm,
            onChange: (e) => handleInputChange(e.target.value),
            onFocus: () => searchTerm.length > 0 && setIsOpen(true),
            type: 'text',
            autoComplete: 'off',
          }}
        />

        {isOpen &&
          filteredUsers.length > 0 &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-9999 mt-1 rounded-sm border border-gray-300 bg-white shadow-lg"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxHeight: '240px',
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="m-0 max-h-[240px] list-none overflow-y-auto p-0 py-1">
                {filteredUsers.map((user) => (
                  <li key={user.userId} className="m-0 list-none p-0">
                    <button
                      type="button"
                      onMouseDown={(e) => addUser(e, user.userId)}
                      className="block w-full cursor-pointer border-0 bg-transparent px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      <span className="font-medium">
                        {user.lastName.toUpperCase()} {user.firstName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )}

        {isOpen &&
          searchTerm.length > 0 &&
          filteredUsers.length === 0 &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-9999 mt-1 rounded-sm border border-gray-300 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Aucun utilisateur trouvé
            </div>,
            document.body,
          )}
      </div>

      {selectedUsers.length > 0 && (
        <p className="mt-1 text-xs text-gray-600">
          {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné
          {selectedUsers.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
