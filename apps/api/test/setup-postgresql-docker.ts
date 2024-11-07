import { startDockerPostgresql } from './docker-postgresql-manager';
import teardown from './teardown-postgresql-docker';

const setup = async (): Promise<void> => {
  try {
    await startDockerPostgresql();
  } catch {
    await teardown();
  }
};

export default setup;
