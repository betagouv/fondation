import { type OpenAPIObject } from '@nestjs/swagger';

type OperationObject = NonNullable<OpenAPIObject['paths'][string]['post']>;

import { publicOpenApiDocument } from './public-openapi';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
// `x-roles` is an extension the OpenAPI types do not know
const answers = (name: string, roles?: string[]): OperationObject =>
  Object.assign(
    { responses: { 200: { description: '', content: { 'application/json': { schema: ref(name) } } } } },
    roles && { 'x-roles': roles },
  );

const document: OpenAPIObject = {
  openapi: '3.1.0',
  info: { title: '', version: '1.0.0' },
  paths: {
    '/api/public/v1/auth': { post: answers('Token') },
    '/api/public/v1/magistrats/identification': { post: answers('Identified', ['API_CLIENT']) },
    '/api/public/v1/magistrats/role': { post: answers('Role', ['MACHINE']) },
    '/sessions/v2': { get: answers('Session') },
  },
  components: {
    schemas: {
      Identified: { type: 'object', properties: { magistrat: ref('Magistrat') } },
      Magistrat: { type: 'object' },
      Role: { type: 'object' },
      Session: { type: 'object' },
      Token: { type: 'object' },
    },
  },
};

describe('The public OpenAPI document', () => {
  const publicDocument = publicOpenApiDocument(document);

  it('keeps the routes under /api/public/v1 an API client can call', () => {
    expect(Object.keys(publicDocument.paths)).toEqual([
      '/api/public/v1/auth',
      '/api/public/v1/magistrats/identification',
    ]);
  });

  it('keeps the schemas these routes reference, even through another schema', () => {
    expect(Object.keys(publicDocument.components!.schemas!)).toEqual(['Identified', 'Magistrat', 'Token']);
  });

  it("does not tell Fondation's roles", () => {
    expect(JSON.stringify(publicDocument)).not.toContain('x-roles');
  });
});
