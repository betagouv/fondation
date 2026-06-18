import Tag from '@codegouvfr/react-dsfr/Tag';

import { GradeEnum } from '@/types/enums.types';
import type { PaginatedMemberListItemDto } from '@api/types';

const GRADES = Object.values(GradeEnum);
type StatArray = PaginatedMemberListItemDto['items'][number]['stats'];

export function MemberListStatCell({ stats }: { stats: StatArray }) {
  const sortedStats = [...stats].sort(
    (a, b) => GRADES.indexOf(b.targetedGrade) - GRADES.indexOf(a.targetedGrade) /* desc by grade */,
  );

  return (stats?.length ?? 0) > 0 ? (
    <ul className="content fr-m-0 fr-p-0 flex list-none flex-row items-center justify-start gap-2">
      {sortedStats.map((stat) => (
        <li key={`member_list_stats_${stat.targetedGrade}`}>
          <Tag small>
            <strong>{GradeEnum[stat.targetedGrade]}</strong>
            <span className="fr-ml-1v">{stat.count}</span>
          </Tag>
        </li>
      ))}
    </ul>
  ) : (
    <span className="fr-pl-3v">-</span>
  );
}
