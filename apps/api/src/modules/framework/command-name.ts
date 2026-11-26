import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type CommandRunner, InjectCommander } from 'nest-commander';

import { WideEvent } from './wide-event';

type Commander = Parameters<CommandRunner['setCommand']>[0];

/** Names the event of the command commander runs (see WideEvent.runCommand), provided by the module of the CLI only */
@Injectable()
export class CommandName implements OnModuleInit {
  constructor(
    @InjectCommander() private readonly commander: Commander,
    private readonly wideEvent: WideEvent,
  ) {}

  onModuleInit(): void {
    // Before commander reads the options of the command, whose parser can throw
    this.commander.hook('preSubcommand', (_, command) => this.name(command));
    // With its subcommand, as `user register`: commander calls the hooks of the root for its subcommands too
    this.commander.hook('preAction', (_, command) => this.name(command));
  }

  private name(command: Commander): void {
    const names = [];
    for (let named: Commander | null = command; named?.parent; named = named.parent)
      names.unshift(named.name());
    this.wideEvent.set({ 'job.name': names.join(' ') });
  }
}
