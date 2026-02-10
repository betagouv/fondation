import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, type FC, type RefObject } from 'react';
import { useDebounce } from 'use-debounce';

import type { FormationEnum } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';

type MemberExclusionSelectorProps = {
  formation: FormationEnum;
  excludedMemberIdsRef: RefObject<string[]>;
};

export const MemberExclusionSelector: FC<MemberExclusionSelectorProps> = ({
  formation,
  excludedMemberIdsRef
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);
  const [selected, setSelected] = useState<Map<string, { firstName: string; lastName: string }>>(new Map());

  const hasSearch = search.trim().length > 0;

  const { data: membersData } = useMemberListQuery({
    formations: ['COMMUN', formation],
    search: debouncedSearch.trim() || undefined,
    pagination: { pageIndex: 0, pageSize: 100 }
  });

  const members = membersData?.items ?? [];

  const displayedMembers = hasSearch
    ? members
    : Array.from(selected.entries()).map(([id, info]) => ({ id, ...info }));

  const toggle = (member: { id: string; firstName: string; lastName: string }) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
      } else {
        next.set(member.id, { firstName: member.firstName, lastName: member.lastName });
      }
      excludedMemberIdsRef.current = Array.from(next.keys());
      return next;
    });
  };

  return (
    <div className="mt-4">
      <Input
        label="Exclusion de membre(s)"
        nativeInputProps={{
          placeholder: 'Rechercher un membre...',
          value: search,
          onChange: (e) => setSearch(e.target.value),
          type: 'text'
        }}
      />
      {displayedMembers.length > 0 && (
        <div className="max-h-32 overflow-y-auto p-4">
          <Checkbox
            options={displayedMembers.map((member) => ({
              label: `${member.lastName} ${member.firstName}`.toUpperCase(),
              nativeInputProps: {
                checked: selected.has(member.id),
                onChange: () => toggle(member)
              }
            }))}
          />
        </div>
      )}
    </div>
  );
};
