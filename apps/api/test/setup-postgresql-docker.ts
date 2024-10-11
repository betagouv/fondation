import teardown from './teardown-postgresql-docker';
import { startDockerPostgresql } from './docker-postgresql-manager';

const setup = async (): Promise<void> => {
  try {
    await startDockerPostgresql();
  } catch {
    await teardown();
  }
};

export default setup;
