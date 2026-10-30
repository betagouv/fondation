import { SeverityEnum } from '@/shared/enums/severity.enum';

export function bySeverity<T extends { severity: SeverityEnum }>(
  messages: readonly T[],
): { messages: T[]; severity: SeverityEnum }[] {
  return Object.values(SeverityEnum)
    .map((severity) => ({ messages: messages.filter((message) => message.severity === severity), severity }))
    .filter(({ messages }) => messages.length > 0);
}
