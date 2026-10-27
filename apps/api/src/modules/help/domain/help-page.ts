import { isSecretariat, type RoleEnum } from '../../shared/role.enum';

export const HELP_PAGES = ['MEMBRE', 'SECRETARIAT_GENERAL'] as const;
export type HelpPageEnum = (typeof HELP_PAGES)[number];

/**
 * the help of the secretariat describes its own tools: a member only reads the help of the member space.
 * An admin reads through the rule of the secretariat, the admin right only existing within it
 */
export function canReadHelpPage(page: HelpPageEnum, reader: { role: RoleEnum }): boolean {
  return page === 'MEMBRE' || isSecretariat(reader.role);
}

export class HelpPageContentWritten {
  constructor(
    readonly content: string,
    readonly editorId: string,
    readonly page: HelpPageEnum,
  ) {}
}

export class IncludedFilesInHelpPageContent {
  constructor(
    readonly fileIds: readonly string[],
    readonly page: HelpPageEnum,
  ) {}
}

export type HelpPageEvent = HelpPageContentWritten | IncludedFilesInHelpPageContent;

export class HelpPage {
  readonly #messages: HelpPageEvent[] = [];

  private constructor(readonly page: HelpPageEnum) {}

  get messages(): readonly HelpPageEvent[] {
    return this.#messages;
  }

  static from(props: { page: HelpPageEnum }): HelpPage {
    return new HelpPage(props.page);
  }

  includeFilesIntoContent(command: { fileIds: readonly string[] }): void {
    if (command.fileIds.length === 0) return;

    this.#messages.push(new IncludedFilesInHelpPageContent(command.fileIds, this.page));
  }

  writeContent(command: { content: string; editorId: string }): void {
    this.#messages.push(new HelpPageContentWritten(command.content, command.editorId, this.page));
  }
}
