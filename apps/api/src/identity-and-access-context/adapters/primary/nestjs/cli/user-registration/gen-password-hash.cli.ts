import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as readline from 'readline';
import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';
import { Writable } from 'stream';
import { IdentityAndAccessModule } from '../../identity-and-access.module';
import { ENCRYPTION_PROVIDER } from '../../tokens';

const promptForPassword = async (): Promise<string> => {
  let showAsterisk = false;

  const mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
      if (!showAsterisk) process.stdout.write(chunk, encoding);
      else process.stdout.write('*', 'utf-8');
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(`Enter password: `, (password) => {
      rl.close();
      resolve(password);
    });
    showAsterisk = true;
  });
};

async function genPasswordHash(app: INestApplicationContext) {
  const password = await promptForPassword();

  try {
    const encryptionProvider = app.get<EncryptionProvider>(ENCRYPTION_PROVIDER);
    console.log(await encryptionProvider.encryptedValue(password));
  } catch (error) {
    console.error('Error creating password hash:', error);
    throw error;
  }
}

const main = async () => {
  const app = await NestFactory.createApplicationContext(
    IdentityAndAccessModule,
  );

  await genPasswordHash(app);
};

console.log('Generating hash password');
main()
  .catch((error) => {
    console.error('Error while creating password hashs:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Successfully created password hash');
    process.exit(0);
  });
