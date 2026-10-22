import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { test } from '../fixtures.ts';

type OpenApi = { paths: Record<string, Record<string, { 'x-roles'?: readonly string[] }>> };

const MEMBER_ROLES = ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'];

const mark = (allowed: boolean) => (allowed ? '✓' : '—');

function accessOf(endpoint: string, roles: readonly string[] | undefined): string {
  if (!roles) return 'public';
  if (roles.includes('MACHINE')) {
    if (roles.length === 1) return 'machine';
    if (roles.length === 2 && roles.includes('ADMIN')) return 'machine ou Administrateur';
    throw new Error(`${endpoint} lets machines in along with user roles`);
  }

  const members = MEMBER_ROLES.filter((role) => roles.includes(role));
  if (members.length > 0 && members.length < MEMBER_ROLES.length) {
    throw new Error(`${endpoint} lets some members in but not all of them`);
  }

  const member = roles.length === 0 || members.length > 0;
  const secretariat = roles.length === 0 || roles.includes('ADJOINT_SECRETAIRE_GENERAL');
  return `Membre ${mark(member)}, Secrétariat général ${mark(secretariat)}`;
}

function servedAccesses(spec: OpenApi): string[] {
  return Object.entries(spec.paths).flatMap(([path, operations]) =>
    Object.entries(operations).map(([method, operation]) => {
      const endpoint = `${method.toUpperCase()} ${path.replace(/^\/api/, '').replace(/\{(\w+)\}/g, ':$1')}`;
      return `${endpoint} : ${accessOf(endpoint, operation['x-roles'])}`;
    }),
  );
}

function listedAccesses(listing: string): string[] {
  const accesses: string[] = [];
  let headers: string[] = [];
  let part = '';

  for (const line of listing.split('\n')) {
    if (line.startsWith('## ') || line.startsWith('### Hors spécification OpenAPI')) part = line;
    if (!line.startsWith('| ')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const endpoint = cells.map((cell) => /^`((?:GET|POST|PUT|PATCH|DELETE) \/\S*)`$/.exec(cell)?.[1]).find(Boolean);
    if (!endpoint) {
      if (cells.includes('Endpoint')) headers = cells;
      continue;
    }

    if (part === '## Accès sans utilisateur') accesses.push(`${endpoint} : ${cells[headers.indexOf('Qui')]}`);
    if (part === "## Actions de l'API") {
      const member = cells[headers.indexOf('Membre')]!.startsWith('✓');
      const secretariat = cells[headers.indexOf('Secrétariat général')]!.startsWith('✓');
      accesses.push(`${endpoint} : Membre ${mark(member)}, Secrétariat général ${mark(secretariat)}`);
    }
  }

  return accesses;
}

test.describe('Rights E2E', () => {
  test('every endpoint is listed in docs/droits-par-role.md with its roles', async ({ baseUrl, expect }) => {
    const spec = (await fetch(`${baseUrl}/openapi/root.json`).then((response) => response.json())) as OpenApi;
    const listing = await readFile(join(import.meta.dirname, '../../../../docs/droits-par-role.md'), 'utf8');

    expect(listedAccesses(listing).toSorted()).toEqual(servedAccesses(spec).toSorted());
  });
});
