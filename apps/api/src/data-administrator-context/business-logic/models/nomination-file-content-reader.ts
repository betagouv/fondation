import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileRead } from '../gateways/repositories/nomination-file-repository';

export class NominationFileContentReader {
  read(parsedContent: string[][]): NominationFileRead[] {
    const [, secondHeader, ...content] = parsedContent;

    const dueDateColumnIndex = secondHeader!.findIndex((col) =>
      col.includes("Date d'échéance"),
    );
    const birthDayColumnIndex = secondHeader!.findIndex((col) =>
      col.includes('Date de naissance'),
    );
    return content.map((row) => ({
      content: {
        dueDate: row[dueDateColumnIndex]
          ? DateOnly.fromString(row[dueDateColumnIndex]!, 'dd/MM/yyyy', 'fr')
          : null,
        birthDate: DateOnly.fromString(
          row[birthDayColumnIndex]!,
          'dd/MM/yyyy',
          'fr',
        ),
      },
    }));
  }
}
