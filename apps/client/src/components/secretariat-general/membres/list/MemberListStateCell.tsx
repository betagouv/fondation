import { GradeEnum } from '@/types/enums.types';
import Tag from '@codegouvfr/react-dsfr/Tag';

import type { PaginatedMemberListItemDto } from '@api/types';

const GRADES = Object.values(GradeEnum);
type StatArray = PaginatedMemberListItemDto['items'][number]['stats'];

export function MemberListStatCell({ stats }: { stats: StatArray }) {
  const sortedStats = [...stats].sort(
    (a, b) => GRADES.indexOf(b.targetedGrade) - GRADES.indexOf(a.targetedGrade) /* desc by grade */
  );

  return (stats?.length ?? 0) > 0 ? (
    <ul className="content m-0 flex list-none flex-row items-center justify-start gap-2 p-0">
      {sortedStats.map((stat) => (
        <li key={`member_list_stats_${stat.targetedGrade}`}>
          <Tag small>
            <strong>{GradeEnum[stat.targetedGrade]}</strong>
            <span className="ml-1">{stat.count}</span>
          </Tag>
        </li>
      ))}
    </ul>
  ) : (
    <span className="pl-3">-</span>
  );
}
