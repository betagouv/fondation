import { forwardRef, Module } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { RegisterUserCliCommand } from './register-user.cli';
import { SimpleAuthModule } from '../../simple-auth.module';

@Command({ name: 'user', subCommands: [RegisterUserCliCommand] })
export class AuthUserCliCommand extends CommandRunner {
  async run() {}
}

@Module({
  imports: [forwardRef(() => SimpleAuthModule)],
  providers: [AuthUserCliCommand, RegisterUserCliCommand],
})
export class AuthCliModule {}
