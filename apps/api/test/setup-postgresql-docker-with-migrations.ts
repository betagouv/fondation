import 'tsconfig-paths/register';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import {
  migrateDockerPostgresql,
  startDockerPostgresql,
} from './docker-postgresql-manager';
import { createBucket } from './minio';
import teardown from './teardown-postgresql-docker';

const setup = async (): Promise<void> => {
  try {
    await startDockerPostgresql();
    await migrateDockerPostgresql();

    await createBucket(
      defaultApiConfig.s3.reportsContext.attachedFilesBucketName,
    );
    await createBucket(
      defaultApiConfig.s3.nominationsContext.transparencesBucketName,
    );
  } catch {
    await teardown();
  }
};

export default setup;
