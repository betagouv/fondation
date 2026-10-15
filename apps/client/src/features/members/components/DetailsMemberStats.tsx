import Select from '@codegouvfr/react-dsfr/Select';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { GradeEnum } from '@/shared/enums/grade.enum';
import { DataTable } from '@/shared/ui/data-table';
import type { DetailedMemberDto } from '@api/types';

type YearStat = { count: number; grade: GradeEnum };

const h = createColumnHelper<YearStat>();

function useYearStatColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('grade', {
        cell: ({ getValue }) => <span className="font-bold">{GradeEnum[getValue()]}</span>,
        header: formatMessage({ defaultMessage: 'Grade' }),
        id: 'grade',
        size: 120,
      }),

      h.accessor('count', {
        header: formatMessage({ defaultMessage: 'Nb. de dossiers affectés' }),
        id: 'count',
        size: 280,
      }),
    ],
    [formatMessage],
  );
}

const GRADES = Object.values(GradeEnum);

function statsPerYear(stats: DetailedMemberDto['stats']) {
  return stats.reduce((map, stat) => {
    const yearStats = map.get(stat.year) ?? GRADES.map((grade) => ({ count: 0, grade }));
    return map.set(
      stat.year,
      yearStats.map((s) => (s.grade === stat.targetedGrade ? { count: stat.count, grade: s.grade } : s)),
    );
  }, new Map<number, YearStat[]>());
}

export function DetailsMemberStats(props: { stats: DetailedMemberDto['stats'] }) {
  const { formatMessage } = useIntl();
  const perYear = useMemo(() => statsPerYear(props.stats), [props.stats]);
  const years = useMemo(() => [...perYear.keys()].sort((a, b) => b - a), [perYear]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(years[0]);
  const year = selectedYear !== undefined && perYear.has(selectedYear) ? selectedYear : years[0];
  const yearStats = useMemo(() => (year === undefined ? [] : (perYear.get(year) ?? [])), [perYear, year]);

  const columns = useYearStatColumns();
  const table = useReactTable({
    columns,
    data: yearStats,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.grade,
  });

  const title = (
    <h2 className="fr-h4 fr-mb-0">
      <FormattedMessage defaultMessage="Statistiques d'attributions" />
    </h2>
  );

  if (years.length === 0) {
    return (
      <div className="flex flex-col gap-y-8">
        {title}
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucun dossier affecté" />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex items-center justify-between gap-4">
        {title}
        <Select
          className="fr-mb-0 w-32"
          label={
            <span className="fr-sr-only">
              <FormattedMessage defaultMessage="Année" />
            </span>
          }
          nativeSelectProps={{
            onChange: (event) => setSelectedYear(Number(event.target.value)),
            value: year,
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Dossiers affectés en {year}' }, { year })}
        emptyLabel={formatMessage({ defaultMessage: 'Aucun dossier affecté' })}
        fluid
        table={table}
        unvirtualized
      />
    </div>
  );
}
