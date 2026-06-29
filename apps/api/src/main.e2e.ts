import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import z from 'zod';

import { AppModule } from './app.module';
import { MultipartFile } from './modules/framework/files/multipart/multipart.file';
import { Sanitizer } from './modules/framework/files/sanitizers';
import { ChildProcessJobRunner } from './modules/ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from './modules/ingest/jobs/runner/in-process-job-runner';

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
    .compile();

  app.useLogger(['log']);
  const server = AppModule.configure(app.createNestApplication());
  await server.listen(port);

  const logger = new Logger(AppModule.name);
  logger.log(`FONDATION running on ${await server.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('FAILURE', err);
  process.exit(1);
});
