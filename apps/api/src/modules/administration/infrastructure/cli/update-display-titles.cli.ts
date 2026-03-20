import { readFile } from 'node:fs/promises';

import { Logger } from '@nestjs/common';
import { CommandRunner, Option, SubCommand } from 'nest-commander';
import { isDefined } from 'src/utils/is-defined';
import { AdministrationService } from '../../administration.service';

@SubCommand({ name: 'titles' })
export class UpdateDisplayTitlesCliCommand extends CommandRunner {
  private readonly logger = new Logger(UpdateDisplayTitlesCliCommand.name);

  constructor(private readonly administration: AdministrationService) {
    super();
  }

  async run(_inputs: string[], options: { file: string }) {
    const content = await readFile(options.file, 'utf-8');
    const entries = content
      .split('\n')
      .map((line) => {
        const [lastName, displayTitle] = line.trim().split(',');
        const trimmedLastName = lastName?.trim();
        if (!trimmedLastName) return undefined;

        return {
          lastName: trimmedLastName,
          displayTitle: displayTitle?.trim() || null,
        };
      })
      .filter(isDefined);

    const { notFound, updatedCount } =
      await this.administration.batchUpdateDisplayTitles(entries);

    for (const lastName of notFound) {
      this.logger.warn(`User not found: ${lastName}`);
    }

    this.logger.log(`Updated ${updatedCount} / ${entries.length}`);
  }

  @Option({
    name: 'file',
    flags: '-f, --file <file>',
    description: `the CSV file in the "<last_name>,<title>" format`,
  })
  parseFile(file: string): string {
    return file;
  }
}
