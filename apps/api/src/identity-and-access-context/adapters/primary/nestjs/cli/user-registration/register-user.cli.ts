import { INestApplicationContext, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Gender, Role } from 'shared-models';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { TRANSACTION_PERFORMER } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Writable } from 'stream';
import { z } from 'zod';
import { IdentityAndAccessModule } from '../../identity-and-access.module';
import { FrameworkModule } from 'src/modules/framework/framework.module';

const userSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    role: z.nativeEnum(Role),
    email: z.string().email(),
    gender: z.nativeEnum(Gender),
  })
  .strict();
type UserJson = z.infer<typeof userSchema>;

const promptForPassword = async (username: string): Promise<string> => {
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
    rl.question(`Enter password for ${username}: `, (password) => {
      rl.close();
      resolve(password);
    });
    showAsterisk = true;
  });
};

async function registerUser(
  user: UserJson,
  app: INestApplicationContext,
  trx: unknown,
) {
  const skipPasswordPrompt =
    process.env.NODE_ENV !== 'production' &&
    process.env.DISABLE_PASSWORD_PROMPT === 'true';

  const password = skipPasswordPrompt
    ? 'test-password-1234'
    : await promptForPassword(
        `${user.firstName} ${user.lastName.toUpperCase()}`,
      );

  const command: RegisterUserCommand = {
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    email: user.email,
    gender: user.gender,
    password,
  };

  try {
    const registerUserUseCase = app.get(RegisterUserUseCase);
    await registerUserUseCase.execute(command)(trx);
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

const readJsonFile = (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsedContent = JSON.parse(fileContent);
  return z.array(userSchema).parse(parsedContent);
};

const args = process.argv.slice(2);

const fromJsonFlagIndex = args.indexOf('--from-json');
if (fromJsonFlagIndex === -1 || !args[fromJsonFlagIndex + 1]) {
  throw new Error('--from-json flag and file path argument are required');
}

const absoluteFilePath = args[fromJsonFlagIndex + 1];
if (!absoluteFilePath) {
  throw new Error('JSON file path must be provided');
}

const isAbsoluteFilePath = path.isAbsolute(absoluteFilePath);
if (!isAbsoluteFilePath)
  throw new Error('JSON file path must be an absolute path');

const main = async () => {
  const users = readJsonFile(absoluteFilePath);

  @Module({ imports: [FrameworkModule, IdentityAndAccessModule] })
  class CliModule {}

  const app = await NestFactory.createApplicationContext(CliModule);

  const transactionPerformer = app.get<TransactionPerformer>(
    TRANSACTION_PERFORMER,
  );

  await transactionPerformer.perform(async (trx) => {
    for (const user of users) {
      await registerUser(user, app, trx);
    }
  });

  await app.close();
};

console.log('Registering users from JSON file:', absoluteFilePath);
main()
  .catch((error) => {
    console.error('Error while registering users:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Successfully registered users');
    process.exit(0);
  });
