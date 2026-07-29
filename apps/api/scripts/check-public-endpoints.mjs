#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import previous from '../public-endpoints.json' with { type: 'json' };

const HERE = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(HERE, '..', 'public-endpoints.json');
const OPENAPI_URL = process.env.OPENAPI_URL || 'http://localhost:3000/openapi/root.json';
const MISSING_REASON = 'TODO — explain why this endpoint must stay public';

async function main() {
  const doc = await fetchOpenApiDocument();
  const discovered = collectPublicOperationIds(doc);
  const previousByOperation = new Map(previous.endpoints.map((entry) => [entry.operation, entry.reason]));

  const nextEndpoints = [...discovered].toSorted().map((operation) => ({
    operation,
    reason: previousByOperation.get(operation) ?? MISSING_REASON,
  }));

  const serialized = JSON.stringify({ endpoints: nextEndpoints }, null, 2) + '\n';
  const previousSerialized = JSON.stringify(previous, null, 2) + '\n';

  if (serialized === previousSerialized) {
    console.log(`No drift — ${discovered.size} public endpoint(s) still match ${ALLOWLIST_PATH}.`);
    return;
  }

  await writeFile(ALLOWLIST_PATH, serialized);
  const added = [...discovered].filter((id) => !previousByOperation.has(id)).sort();
  const removed = [...previousByOperation.keys()].filter((id) => !discovered.has(id)).sort();
  console.log(`Rewrote ${ALLOWLIST_PATH}.`);
  if (added.length) console.log(`  Added:   ${added.join(', ')}`);
  if (removed.length) console.log(`  Removed: ${removed.join(', ')}`);
}

async function fetchOpenApiDocument() {
  const response = await fetch(OPENAPI_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${OPENAPI_URL}: HTTP ${response.status}`);
  }
  return response.json();
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

/** @returns {Set<string>} */
function collectPublicOperationIds(doc) {
  const globalSecurity = Array.isArray(doc.security) ? doc.security : [];
  const publicOperationIds = new Set();
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(item ?? {})) {
      if (!HTTP_METHODS.has(method)) continue;
      if (!operation || typeof operation !== 'object') continue;
      const security = Array.isArray(operation.security) ? operation.security : globalSecurity;
      if (security.length > 0) continue;
      const operationId = operation.operationId;
      if (!operationId) {
        throw new Error(`Public operation without operationId: ${method.toUpperCase()} ${path}`);
      }
      publicOperationIds.add(operationId);
    }
  }
  return publicOperationIds;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
