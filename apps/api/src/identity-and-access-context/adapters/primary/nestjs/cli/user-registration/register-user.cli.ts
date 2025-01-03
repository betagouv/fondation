import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { z } from 'zod';
import { IdentityAndAccessModule } from '../../identity-and-access.module';

const registerUserCli = async (
  app: INestApplicationContext,
  command: RegisterUserCommand,
) => {
  const registerUserUseCase = await app.resolve(RegisterUserUseCase);

  try {
    await registerUserUseCase.execute(command);
  } catch (error) {
    console.error('Error registering user:', error);
  }
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

const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(Role),
  email: z.string().email(),
  password: z.string().optional(),
});

const readJsonFile = (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsedContent = JSON.parse(fileContent);
  return z.array(userSchema).parse(parsedContent);
};

export const promptForPassword = async (username: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Enter password for ${username}: `, (password) => {
      rl.close();
      resolve(password);
    });
  });
};

const main = async () => {
  const users = readJsonFile(absoluteFilePath);
  const app = await NestFactory.createApplicationContext(
    IdentityAndAccessModule,
  );

  for (const user of users) {
    console.log('Registering user:', user);
    const skipPasswordPrompt = process.env.DISABLE_PASSWORD_PROMPT === 'true';
    user.password = skipPasswordPrompt
      ? 'test-password-1234'
      : await promptForPassword(
          `${user.firstName} ${user.lastName.toUpperCase()}`,
        );

    const command: RegisterUserCommand = {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      password: user.password,
    };

    await registerUserCli(app, command);
  }

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
