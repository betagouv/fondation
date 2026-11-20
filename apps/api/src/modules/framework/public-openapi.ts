import { type OpenAPIObject } from '@nestjs/swagger';

const PUBLIC_PATH_PREFIX = '/api/public/v1';
const SCHEMA_REF = /^#\/components\/schemas\/(.+)$/;

type Operation = { 'x-roles'?: string[] } & Record<string, unknown>;
type Schemas = NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>;

/**
 * The document handed to the API clients: the routes under `/api/public/v1` they can call, and the schemas these
 * routes reference, nothing else
 *
 * @remarks a route reserved to another role (the fixed machine tokens) stays out, and so does `x-roles`, which only
 * serves Fondation's own checks. The schemas lose the `_Output` suffix of nestjs-zod: the API clients generate their
 * types from these names, which can no longer change once the document is handed over
 */
export function publicOpenApiDocument(document: OpenAPIObject): OpenAPIObject {
  const paths: OpenAPIObject['paths'] = {};
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith(PUBLIC_PATH_PREFIX)) continue;

    const operations = Object.entries(item as Record<string, Operation>).flatMap(
      ([method, { 'x-roles': roles, ...operation }]) =>
        !roles || roles.includes('API_CLIENT') ? [[method, operation]] : [],
    );
    if (operations.length) paths[path] = Object.fromEntries(operations);
  }

  const schemas = document.components?.schemas ?? {};
  const origins = new Map<string, string>();
  const publicSchemas: Schemas = {};
  const copy = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(copy);
    if (!node || typeof node !== 'object') return node;

    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => {
        const name = key === '$ref' && typeof value === 'string' && SCHEMA_REF.exec(value)?.[1];
        if (!name) return [key, copy(value)];

        const publicName = name.replace(/_Output$/, '');
        if (!origins.has(publicName)) {
          origins.set(publicName, name);
          publicSchemas[publicName] = copy(schemas[name]) as Schemas[string];
        } else if (origins.get(publicName) !== name) {
          throw new Error(`${name} and ${origins.get(publicName)} would both be named ${publicName}`);
        }
        return [key, `#/components/schemas/${publicName}`];
      }),
    );
  };

  return {
    openapi: document.openapi,
    info: {
      title: 'Fondation public API',
      version: document.info.version,
      description:
        'Ask `POST /api/public/v1/auth` for a token, then send it as `Authorization: Bearer <token>`',
    },
    paths: copy(paths) as OpenAPIObject['paths'],
    components: {
      schemas: Object.fromEntries(Object.entries(publicSchemas).toSorted(([a], [b]) => a.localeCompare(b))),
      securitySchemes: {
        bearer: { description: 'The `access_token` given by `/auth`', scheme: 'bearer', type: 'http' },
      },
    },
  };
}
