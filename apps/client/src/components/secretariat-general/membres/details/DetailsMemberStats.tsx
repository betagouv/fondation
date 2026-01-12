import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';

import { DataTable, useDataTable } from '@/components/shared/data-table';
import { GradeEnum } from '@/types/enums.types';
import type { DetailedMemberDto } from '@api/types';

const h = createColumnHelper<{ count: number; grade: GradeEnum }>();
const columns = [
  h.accessor('grade', {
    enableSorting: false,
    header: () => 'Grade',
    cell: ({ row }) => <div className="font-bold">{GradeEnum[row.original.grade]}</div>,
    meta: { multiline: false, size: '10%' }
  }),

  h.accessor('count', {
    enableSorting: false,
    header: () => 'Nb. de dossiers affectés',
    cell: ({ row }) => row.original.count,
    meta: { multiline: false }
  })
];

const GRADES = Object.values(GradeEnum);

function DetailMemberYearStat(props: { year: number; stats: { grade: GradeEnum; count: number }[] }) {
  const table = useDataTable({
    columns,
    data: props.stats,
    enableSorting: false,
    enablePagination: false,
    enableColumnFilters: false
  });

  return <DataTable table={table} caption={<h4>Année {props.year}</h4>} />;
}

export function DetailsMemberStats({ stats }: { stats: DetailedMemberDto['stats'] }) {
  const map = React.useMemo(
    () =>
      stats.reduce((m, stat) => {
        const mapPerYear = m.get(stat.year) ?? GRADES.map((grade) => ({ grade, count: 0 }));
        return m.set(
          stat.year,
          mapPerYear.map((s) => (s.grade === stat.targetedGrade ? { grade: s.grade, count: stat.count } : s))
        );
      }, new Map<number, { grade: GradeEnum; count: number }[]>()),
    [stats]
  );

  return (
    <>
      {[...map.entries()]
        .sort(([yearA], [yearB]) => yearB - yearA /* desc by year */)
        .map(([year, stats]) => (
          <DetailMemberYearStat key={year} year={year} stats={stats} />
        ))}
    </>
  );
}
