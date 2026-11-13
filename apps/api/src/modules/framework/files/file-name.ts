import { BadRequestException } from '@nestjs/common';

const FILE_NAME_MAX_LENGTH = 255;

export class InvalidFileName extends BadRequestException {}

/** a renamed file keeps the extension it was added with: its name changes, not its format */
export function renamedFileName(current: string, baseName: string): string {
  const trimmed = baseName.trim();
  if (!trimmed) throw new InvalidFileName('a file name cannot be empty');
  // nobody types them, and Postgres refuses the NUL byte
  if (/\p{Cc}/u.test(trimmed)) throw new InvalidFileName('a file name holds no control character');

  const lastDot = current.lastIndexOf('.');
  const name = lastDot > 0 ? `${trimmed}${current.slice(lastDot)}` : trimmed;
  if (name.length > FILE_NAME_MAX_LENGTH) {
    throw new InvalidFileName(
      `a file name holds ${FILE_NAME_MAX_LENGTH} characters at most, extension included`,
    );
  }

  return name;
}
