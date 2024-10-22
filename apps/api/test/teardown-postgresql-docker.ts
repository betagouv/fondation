import { db, dockerDBInstance } from './docker-postgresql-manager';

const teardown = async (): Promise<void> => {
  await endDbConnection();
  await endDockerCompose();
};

const endDbConnection = async () => {
  console.log('closing db connection');
  try {
    await db.$client.end();
  } catch (e) {
    console.log('Failing to close db connection', e);
  }
  console.log('closed db connection');
};

const endDockerCompose = async () => {
  console.log('Shutting dow docker compose containers');
  try {
    await dockerDBInstance?.down();
    console.log('removed docker containers');
  } catch (e) {
    console.log('Failing to shutdown the docker containers', e);
  }
};

export default teardown;
