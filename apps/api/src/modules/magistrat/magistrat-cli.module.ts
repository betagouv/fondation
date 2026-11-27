import { Logger, Module } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

import { MagistratModule } from './magistrat.module';
import { MagistratService } from './magistrat.service';

@Command({
  description: 'forgets the addresses the CSM website could not identify for 30 days',
  name: 'forget-old-unrecognised-emails',
})
export class ForgetOldUnrecognisedEmailsCommand extends CommandRunner {
  private readonly logger = new Logger(ForgetOldUnrecognisedEmailsCommand.name);

  constructor(private readonly magistrats: MagistratService) {
    super();
  }

  async run(): Promise<void> {
    const count = await this.magistrats.forgetOldUnrecognisedEmails();
    this.logger.log(`Forgot ${count} unrecognised addresses`);
  }
}

@Module({ imports: [MagistratModule], providers: [ForgetOldUnrecognisedEmailsCommand] })
export class MagistratCliModule {}
