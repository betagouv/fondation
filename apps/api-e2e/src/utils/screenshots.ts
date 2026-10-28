import type { Sql } from 'postgres';

export async function isStored(sql: Sql, fileId: string): Promise<boolean> {
  const [row] = await sql<{ count: bigint }[]>`select count(*) from files_context.files where id = ${fileId}`;

  return Number(row?.count ?? 0) > 0;
}
