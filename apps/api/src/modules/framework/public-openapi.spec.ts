import { type OpenAPIObject } from '@nestjs/swagger';

import { publicOpenApiDocument } from './public-openapi';

type OperationObject = NonNullable<OpenAPIObject['paths'][string]['post']>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
// `x-roles` is an extension the OpenAPI types do not know
const answers = (name: string, roles?: string[]): OperationObject =>
  Object.assign(
    { responses: { 200: { content: { 'application/json': { schema: ref(name) } }, description: '' } } },
    roles && { 'x-roles': roles },
  );

const document: OpenAPIObject = {
  openapi: '3.1.0',
  info: { title: '', version: '1.0.0' },
  paths: {
    '/api/public/v1/auth': { post: answers('Token_Output') },
    '/api/public/v1/magistrats/identification': { post: answers('Identified', ['API_CLIENT']) },
    // no public route is reserved to the machines today: this one only stands for the case
    '/api/public/v1/machine-only': { post: answers('Role', ['MACHINE']) },
    '/sessions/v2': { get: answers('Session') },
  },
  components: {
    schemas: {
      Identified: { properties: { magistrat: ref('Magistrat') }, type: 'object' },
      Magistrat: { type: 'object' },
      Role: { type: 'object' },
      Session: { type: 'object' },
      Token_Output: { type: 'object' },
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

  it('names a schema without the _Output suffix of nestjs-zod, in the routes too', () => {
    expect(publicDocument.paths['/api/public/v1/auth']!.post!.responses[200]).toEqual({
      content: { 'application/json': { schema: ref('Token') } },
      description: '',
    });
  });

  it('refuses two schemas the suffix removal would merge', () => {
    const paths = { '/api/public/v1/auth': { get: answers('Token'), post: answers('Token_Output') } };

    expect(() => publicOpenApiDocument({ ...document, paths })).toThrow(
      'Token_Output and Token would both be named Token',
    );
  });

  it("does not tell Fondation's roles", () => {
    expect(JSON.stringify(publicDocument)).not.toContain('x-roles');
  });
});
