import { dockerDBInstance } from './docker-postgresql-manager';

const teardown = async (): Promise<void> => {
  console.log('removing DB instance');
  try {
    await dockerDBInstance?.down();
    console.log('removed DB instance');
  } catch (e) {
    console.log('Failing to down the docker db instance', e);
  }
};

export default teardown;
