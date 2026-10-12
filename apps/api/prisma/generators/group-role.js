#!/usr/bin/env node

const { writeFile } = require('node:fs/promises');
const { generatorHandler } = require('@prisma/generator-helper');
const assert = require('node:assert');

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

  return results.sort((a, b) => a.schema.localeCompare(b.schema) || a.dbName.localeCompare(b.dbName));
}

const OUTPUT = __dirname + '/../../scripts/gen-group-role.sql';

generatorHandler({
  onManifest: () => ({
    version: '0.0.0',
    defaultOutput: OUTPUT,
  }),

  async onGenerate(h) {
    const datasource = h.datasources.find((d) => d.name === 'db');

    const schemas = datasource?.schemas.toSorted((a, b) => a.localeCompare(b)) ?? [];

    const dbUrl =
      datasource?.url?.value ?? process.env[datasource?.url?.fromEnvVar ?? ''] ?? process.env.DATABASE_URL;
    const dbName = new URL(dbUrl ?? '').pathname;
    assert.ok(dbName);

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
      `REVOKE ALL PRIVILEGES ON DATABASE ${dbName} FROM fon_user;\n` +
      `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM fon_user;\n` +
      `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM fon_user;\n\n` +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA\n  ${privateSchemas}\nTO fon_user;\n\n` +
      `GRANT USAGE ON ALL SEQUENCES IN SCHEMA\n  ${allSchemas}\nTO fon_user;\n\n` +
      `GRANT USAGE ON TYPE \n  ${types}\nTO fon_user;\n\n` +
      `COMMIT;\n`;

    await writeFile(OUTPUT, sql, 'utf8');
  },
});
