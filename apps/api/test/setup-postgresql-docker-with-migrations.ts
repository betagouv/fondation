import {
  createMinioBucket,
  migrateDockerPostgresql,
  startDockerPostgresql,
} from './docker-postgresql-manager';
import teardown from './teardown-postgresql-docker';

const setup = async (): Promise<void> => {
  try {
    await startDockerPostgresql();
    await migrateDockerPostgresql();
    await createMinioBucket();
  } catch {
    await teardown();
  }
};

export default setup;
