import { forwardRef, Module } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { AdministrationModule } from 'src/modules/administration/administration.module';
import { UpdateDisplayTitlesCliCommand } from 'src/modules/administration/infrastructure/cli/update-display-titles.cli';
import { SimpleAuthModule } from '../../simple-auth.module';
import { RegisterUserCliCommand } from './register-user.cli';

@Command({
  name: 'user',
  subCommands: [RegisterUserCliCommand, UpdateDisplayTitlesCliCommand],
})
export class AuthUserCliCommand extends CommandRunner {
  async run() {}
}

@Module({
  imports: [
    forwardRef(() => SimpleAuthModule),
    forwardRef(() => AdministrationModule),
  ],
  providers: [
    AuthUserCliCommand,
    RegisterUserCliCommand,
    UpdateDisplayTitlesCliCommand,
  ],
})
export class AuthCliModule {}
