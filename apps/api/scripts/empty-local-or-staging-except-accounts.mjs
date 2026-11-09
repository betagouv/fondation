#!/usr/bin/env node
import { DeleteObjectsCommand, ListObjectVersionsCommand, S3Client } from '@aws-sdk/client-s3';
import pg from 'pg';

// Empties the sessions of the local or staging database and bucket, with what comes from them, so that the
// fictitious LOLFI archive can be ingested again. It keeps the login accounts, the help center, the feedbacks
// and the surveys. Without --confirm <database>, it only tells what it would erase.
// Run it while no ingestion is going on: it would empty the jobs under a running one.

// Production is refused by omission: only the local database and the staging one may be emptied
const LOCAL_AND_STAGING_DATABASES = ['fondation', 'fondation_a_3234'];
const LOCAL_AND_STAGING_BUCKET_PREFIXES = ['sandbox-', 'staging-'];
// public and drizzle hold the migrations history, of Prisma and of the ORM used before it on staging
const SCHEMAS_KEPT = ['drizzle', 'identity_and_access_context', 'information_schema', 'public'];
// Stored beside the accounts, but it references the jurisdictions: TRUNCATE refuses to empty them without it
const EXCLUDED_JURISDICTIONS = 'identity_and_access_context.excluded_jurisdictions';
// files_context.files is only kept for the files a kept table references, see FILES_NOT_KEPT
const TABLES_KEPT = [
  'docs.justice_department_contact',
  'files_context.file_public_url',
  'files_context.files',
  'nominations_context.feedback',
  'nominations_context.feedback_status_change',
  'nominations_context.help_page_screenshots',
  'nominations_context.help_pages',
  'nominations_context.member_survey',
  'nominations_context.secretariat_survey',
  'nominations_context.survey',
];
const OBJECTS_KEPT_PREFIX = 'help/';
const FILES_NOT_KEPT = `FROM files_context.files
  WHERE id NOT IN (SELECT file_id FROM nominations_context.help_page_screenshots)`;

async function main() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    const {
      rows: [{ database }],
    } = await db.query('SELECT current_database() AS database');
    if (!LOCAL_AND_STAGING_DATABASES.includes(database))
      throw new Error(`Refusing to empty the database "${database}"`);

    const bucket = process.env.S3_BUCKET || process.env.S3_REPORTS_ATTACHED_FILES_BUCKET;
    if (!LOCAL_AND_STAGING_BUCKET_PREFIXES.some((prefix) => bucket?.startsWith(prefix))) {
      throw new Error(`Refusing to empty the bucket "${bucket}"`);
    }

    const tables = await tablesToEmpty(db);
    const otherAccountTables = tables.filter(({ name }) => name !== EXCLUDED_JURISDICTIONS);
    if (otherAccountTables.some(({ name }) => name.startsWith('identity_and_access_context.'))) {
      throw new Error('Refusing to empty a table of the login accounts');
    }
    const accountsCount = await countLoginAccounts(db);
    const s3 = s3Client();
    const objects = await listObjectVersionsToDelete(s3, bucket);
    const {
      rows: [{ filesCount }],
    } = await db.query(`SELECT count(*)::int AS "filesCount" ${FILES_NOT_KEPT}`);

    console.log(`Database "${database}": ${accountsCount} login accounts kept`);
    for (const name of TABLES_KEPT) {
      const {
        rows: [{ count }],
      } = await db.query(`SELECT count(*)::int AS count FROM ${name}`);
      console.log(
        `  kept ${name}: ${count} rows${name === 'files_context.files' ? ` (${filesCount} to delete)` : ''}`,
      );
    }
    console.log(`Database "${database}": ${tables.length} tables to empty`);
    for (const { name, rowsCount } of tables) if (rowsCount > 0) console.log(`  ${name}: ${rowsCount} rows`);
    console.log(
      `Bucket "${bucket}": ${objects.length} objects and versions to delete, "${OBJECTS_KEPT_PREFIX}" kept`,
    );

    const confirmFlag = process.argv.indexOf('--confirm');
    const confirmedDatabase = confirmFlag === -1 ? undefined : process.argv[confirmFlag + 1];
    if (confirmedDatabase !== database) {
      console.log(`Nothing erased. Run again with --confirm ${database} to empty it.`);
      return;
    }

    // Without CASCADE, a kept table referencing an emptied one makes it fail instead of erasing silently
    await db.query('BEGIN');
    await db.query(`TRUNCATE ${tables.map(({ name }) => name).join(', ')} RESTART IDENTITY`);
    await db.query(`DELETE ${FILES_NOT_KEPT}`);
    const accountsLeft = await countLoginAccounts(db);
    if (accountsLeft !== accountsCount) {
      throw new Error(`The login accounts went from ${accountsCount} to ${accountsLeft}: nothing erased`);
    }
    await db.query('COMMIT');
    console.log(`Database "${database}" emptied, ${accountsLeft} login accounts kept`);

    // Only once the database committed, so that it never references a deleted object
    await emptyBucket(s3, bucket);
    console.log(`Bucket "${bucket}" emptied`);
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
}

async function countLoginAccounts(db) {
  const {
    rows: [{ count }],
  } = await db.query('SELECT count(*)::int AS count FROM identity_and_access_context.users');
  return count;
}

async function tablesToEmpty(db) {
  const { rows } = await db.query(
    `SELECT format('%I.%I', table_schema, table_name) AS name
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE' AND table_schema <> ALL($1) AND table_schema NOT LIKE 'pg\\_%'
     ORDER BY 1`,
    [SCHEMAS_KEPT],
  );

  const tables = [];
  const names = rows.map((row) => row.name).filter((name) => !TABLES_KEPT.includes(name));
  for (const name of [...names, EXCLUDED_JURISDICTIONS]) {
    const {
      rows: [{ count }],
    } = await db.query(`SELECT count(*)::int AS count FROM ${name}`);
    tables.push({ name, rowsCount: count });
  }
  return tables;
}

function s3Client() {
  return new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || process.env.SCW_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY || process.env.SCW_SECRET_KEY,
    },
    endpoint: process.env.S3_ENDPOINT || 'https://s3.fr-par.scw.cloud',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    region: process.env.S3_REGION || 'fr-par',
  });
}

// The bucket is versioned: deleting an object only hides it behind a marker, its versions remain
async function listAllObjectVersions(s3, bucket) {
  const versions = [];
  let markers = {};
  do {
    const page = await s3.send(new ListObjectVersionsCommand({ Bucket: bucket, ...markers }));
    for (const { Key, VersionId } of [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])]) {
      versions.push({ Key, VersionId });
    }
    markers = page.IsTruncated
      ? { KeyMarker: page.NextKeyMarker, VersionIdMarker: page.NextVersionIdMarker }
      : undefined;
  } while (markers);
  return versions;
}

async function listObjectVersionsToDelete(s3, bucket) {
  const versions = await listAllObjectVersions(s3, bucket);
  return versions.filter(({ Key }) => !Key.startsWith(OBJECTS_KEPT_PREFIX));
}

async function emptyBucket(s3, bucket) {
  const versions = await listObjectVersionsToDelete(s3, bucket);
  for (let i = 0; i < versions.length; i += 1000) {
    const { Errors } = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: versions.slice(i, i + 1000), Quiet: true },
      }),
    );
    if (Errors?.length)
      throw new Error(`Could not delete ${Errors.length} objects, first: ${Errors[0].Message}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
