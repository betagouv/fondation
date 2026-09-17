import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import z from 'zod';

import { AppModule } from './app.module';
import { MultipartFile } from './modules/framework/files/multipart/multipart.file';
import { Sanitizer } from './modules/framework/files/sanitizers';
import { GotenbergHttpClient } from './modules/framework/pdf/gotenberg-http-client.service';
import { ChildProcessJobRunner } from './modules/ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from './modules/ingest/jobs/runner/in-process-job-runner';

const BLANK_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

async function bootstrap() {
  const port = z.coerce.number().int().default(0).parse(process.env.PORT);
  const app = await Test.createTestingModule({
    imports: [AppModule],
  })
    .setLogger(new Logger())
    .overrideProvider(ChildProcessJobRunner)
    .useClass(InProcessJobRunner)
    .overrideProvider(Sanitizer)
    .useValue({ sanitize: async (file: MultipartFile) => file })
    .overrideProvider(GotenbergHttpClient)
    .useValue({ htmlToPdf: async () => BLANK_PDF })
    .compile();

  app.useLogger(['log']);
  const server = AppModule.configure(app.createNestApplication());
  await server.listen(port);

  // A bare SIGTERM terminates without writing NODE_V8_COVERAGE: exit cleanly instead
  process.on('SIGTERM', () => process.exit(0));

  const logger = new Logger(AppModule.name);
  logger.log(`FONDATION running on ${await server.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('FAILURE', err);
  process.exit(1);
});
