import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

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
            .addCookieAuth('sessionId')
            .build(),
          { operationIdFactory: (_, methodKey) => methodKey },
        ),
      ),
    { jsonDocumentUrl: '/openapi/root.json' },
  );
}
