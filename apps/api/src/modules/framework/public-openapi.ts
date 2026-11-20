import { type OpenAPIObject } from '@nestjs/swagger';

const PUBLIC_PATH_PREFIX = '/api/public/v1';

type Operation = { 'x-roles'?: string[] } & Record<string, unknown>;

/**
 * The document handed to the API clients: the routes under `/api/public/v1` they can call, and the schemas these
 * routes reference, nothing else
 *
 * @remarks a route reserved to another role (the fixed machine tokens) stays out, and so does `x-roles`, which only
 * serves Fondation's own checks
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
  const referenced = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      const name =
        key === '$ref' && typeof value === 'string' && /^#\/components\/schemas\/(.+)$/.exec(value)?.[1];
      if (name && !referenced.has(name)) {
        referenced.add(name);
        visit(schemas[name]);
      } else visit(value);
    }
  };
  visit(paths);

  return {
    openapi: document.openapi,
    info: {
      title: 'Fondation public API',
      version: document.info.version,
      description:
        'Ask `POST /api/public/v1/auth` for a token, then send it as `Authorization: Bearer <token>`',
    },
    paths,
    components: {
      schemas: Object.fromEntries(Object.entries(schemas).filter(([name]) => referenced.has(name))),
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer', description: 'The `access_token` given by `/auth`' },
      },
    },
  };
}
