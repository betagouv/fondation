import { db, dockerDBInstance } from './docker-postgresql-manager';

const teardown = async (): Promise<void> => {
  if (db) {
    await endDbConnection();
  }
  await endDockerCompose();
};

const endDbConnection = async () => {
  try {
    if (!db.$client.ended) await db.$client.end();
  } catch (e) {
    console.log('Failing to close db connection', e);
  }
  console.log('Closed db connection');
};

export const endDockerCompose = async () => {
  console.log('Shutting dow docker compose containers');
  try {
    await dockerDBInstance?.down();
    console.log('Removed docker containers');
  } catch (e) {
    console.log('Failing to shutdown the docker containers', e);
  }
};

export default teardown;
