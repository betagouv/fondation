import { forwardRef, Module } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

import { AdministrationModule } from '../../../administration/administration.module';
import { RegisterUserCliCommand } from '../../../administration/infrastructure/cli/register-user.cli';
import { UpdateDisplayTitlesCliCommand } from '../../../administration/infrastructure/cli/update-display-titles.cli';
import { SimpleAuthModule } from '../../simple-auth.module';

@Command({
  name: 'user',
  subCommands: [RegisterUserCliCommand, UpdateDisplayTitlesCliCommand],
})
export class AuthUserCliCommand extends CommandRunner {
  async run() {}
}

@Module({
  imports: [forwardRef(() => SimpleAuthModule), forwardRef(() => AdministrationModule)],
  providers: [AuthUserCliCommand, RegisterUserCliCommand, UpdateDisplayTitlesCliCommand],
})
export class AuthCliModule {}
