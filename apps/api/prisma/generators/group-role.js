#!/usr/bin/env node

const { writeFile } = require('node:fs/promises');
const { generatorHandler } = require('@prisma/generator-helper');

/** @param {string} datamodel prisma's raw datamodel */
function parseEnumGrants(datamodel) {
  const enumBlockRegex = /^enum\s+\w+\s*\{([^}]*)}/gm;
  const results = [];

  for (const match of datamodel.matchAll(enumBlockRegex)) {
    const block = match[1];
    const dbName = block.match(/@@map\("([^"]+)"\)/)?.[1];
    const schema = block.match(/@@schema\("([^"]+)"\)/)?.[1];
    if (dbName && schema) results.push({ dbName, schema });
  }

  return results.sort(
    (a, b) =>
      a.schema.localeCompare(b.schema) || a.dbName.localeCompare(b.dbName),
  );
}

function sql(list, ...args) {
  return String.raw(list, ...args);
}

/** @param {string} role @return {string} */
function createIfNotExist(role) {
  return sql`DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = '${role}')
  THEN
      CREATE ROLE ${role};
   END IF;
END
$do$;`;
}

const OUTPUT = __dirname + '/../../scripts/gen-group-role.sql';

generatorHandler({
  onManifest: () => ({
    version: '0.0.0',
    defaultOutput: OUTPUT,
  }),

  async onGenerate(h) {
    const schemas = h.datasources
      .find((d) => d.name === 'db')
      ?.schemas.toSorted((a, b) => a.localeCompare(b));

    const allSchemas = schemas.map((x) => `"${x}"`).join(',\n  ');
    const privateSchemas = schemas
      .filter((x) => x !== 'public')
      .map((x) => `"${x}"`)
      .join(',\n  ');

    const types = parseEnumGrants(h.datamodel)
      .map(({ schema, dbName }) => `"${schema}"."${dbName}"`)
      .join(',\n  ');

    const sql =
      `BEGIN;\n\n` +
      createIfNotExist('fon_group') +
      '\n\n' +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA\n  ${privateSchemas}\nTO fon_group;\n\n` +
      `GRANT USAGE ON ALL SEQUENCES IN SCHEMA\n  ${allSchemas}\nTO fon_group;\n\n` +
      `GRANT USAGE ON TYPE \n  ${types}\nTO fon_group;\n\n` +
      `COMMIT;\n`;

    await writeFile(OUTPUT, sql, 'utf8');
  },
});
