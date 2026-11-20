import { applyDecorators, INestApplication, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  DocumentBuilder,
  getSchemaPath,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { publicOpenApiDocument } from './public-openapi';

type DiscriminatedByTypeDto = Type<unknown> & {
  schema: { shape: { '@type': { value: string } } };
};

/**
 * exposes the right openapi schema for a response discriminated by `@type`
 *
 * @warning the OpenAPI discriminator falls back to the schema name when no mapping is given,
 * which breaks the generated client. The mapping is read from the `@type` literals to stay in sync
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

const swaggerOptions = { defaultModelsExpandDepth: -1, displayOperationId: true, docExpansion: 'none' };

export function openapi(app: INestApplication): void {
  let document: OpenAPIObject | undefined;
  const fullDocument = () =>
    (document ??= cleanupOpenApiDoc(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setOpenAPIVersion('3.1.0')
          .setDescription(`[raw JSON](/openapi/root.json), [public API](/openapi/public)`)
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
    ));

  SwaggerModule.setup('/openapi', app, fullDocument, {
    jsonDocumentUrl: '/openapi/root.json',
    swaggerOptions,
  });
  SwaggerModule.setup('/openapi/public', app, () => publicOpenApiDocument(fullDocument()), {
    jsonDocumentUrl: '/openapi/public.json',
    swaggerOptions,
  });
}
