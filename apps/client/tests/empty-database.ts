import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL || 'postgres://fondation:secret@localhost:5435/fondation_test';

/** every run seeds its own sessions: past ones would push the new one out of the first page of the lists */
export async function emptyDatabase(): Promise<void> {
  const sql = postgres(databaseUrl, { onnotice: () => {} });
  try {
    await sql`
      truncate "identity_and_access_context"."users" cascade;

      truncate "data_administration_context"."session" cascade;
      truncate "data_administration_context"."jurisdictions" cascade;
      truncate "data_administration_context"."function" cascade;
      truncate "data_administration_context"."grade" cascade;

      truncate "nominations_context"."magistrat" cascade;
      truncate "nominations_context"."session" cascade;

      truncate "reports_context"."reports" cascade;

      truncate "files_context"."files" cascade;

      truncate "jobs"."ingestion_job" cascade;
      truncate "jobs"."lolfi_transparence_anomaly" cascade;

      truncate "docs"."agenda" cascade;
    `.simple();
  } finally {
    await sql.end();
  }
}
