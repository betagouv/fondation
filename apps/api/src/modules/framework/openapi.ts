import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
            .addCookieAuth('sessionId', {
              name: 'sessionId',
              type: 'apiKey',
              in: 'cookie',
            })
            .addBasicAuth({
              type: 'http',
              scheme: 'basic',
            })
            .build(),
          { operationIdFactory: (_, methodKey) => methodKey },
        ),
        { version: '3.0' },
      ),
    { jsonDocumentUrl: '/openapi/root.json' },
  );
}
