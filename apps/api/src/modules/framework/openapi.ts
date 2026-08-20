import { applyDecorators, INestApplication, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  DocumentBuilder,
  getSchemaPath,
  SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

type DiscriminatedByTypeDto = Type<unknown> & {
  schema: { shape: { '@type': { value: string } } };
};

/**
 * exposes the right openapi schema for a response discriminated by `@type`
 *
 * @warning the OpenAPI discriminator falls back to the schema name when no mapping is given,
 * which breaks the generated client. The mapping is read from the `@type` literals to stay in sync.
 */
export function ApiOkDiscriminatedByType(
  ...dtos: readonly [DiscriminatedByTypeDto, DiscriminatedByTypeDto, ...DiscriminatedByTypeDto[]]
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(...dtos),
    ApiOkResponse({
      schema: {
        type: 'object',
        discriminator: {
          propertyName: '@type',
          mapping: Object.fromEntries(
            dtos.map((dto) => [dto.schema.shape['@type'].value, getSchemaPath(dto)]),
          ),
        },
        oneOf: dtos.map((dto) => ({ $ref: getSchemaPath(dto) })),
      },
    }),
  );
}

export function openapi(app: INestApplication): void {
  SwaggerModule.setup(
    '/openapi',
    app,
    () =>
      cleanupOpenApiDoc(
        SwaggerModule.createDocument(
          app,
          new DocumentBuilder()
            .setDescription(`[raw JSON](/openapi/root.json)`)
            .addCookieAuth('sessionId', {
              name: 'sessionId',
              type: 'apiKey',
              in: 'cookie',
            })
            .addBasicAuth({
              type: 'http',
              scheme: 'basic',
            })
            .addBearerAuth()
            .build(),
          { operationIdFactory: (_, methodKey) => methodKey },
        ),
        { version: '3.0' },
      ),
    {
      jsonDocumentUrl: '/openapi/root.json',
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
        displayOperationId: true,
        docExpansion: 'none',
      },
    },
  );
}
