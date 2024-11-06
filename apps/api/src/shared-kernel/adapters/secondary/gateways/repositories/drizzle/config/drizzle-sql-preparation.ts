import { getTableColumns, sql, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export const buildConflictUpdateColumns = <
  T extends PgTable,
  Q extends keyof T['_']['columns'],
>(
  table: T,
  columns: Q[],
) => {
  const cls = getTableColumns(table);

  return columns.reduce(
    (acc, column) => {
      const col = cls[column];
      if (!col) return acc;

      const colName = col.name;
      acc[column] = sql.raw(`excluded.${colName}`);

      return acc;
    },
    {} as Record<Q, SQL>,
  );
};
