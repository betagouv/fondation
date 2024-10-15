import { TsvHeaderColumnMismatchError } from '../errors/tsv-header-column-mismatch.error';
import { TsvHeaderCountMismatchError } from '../errors/tsv-header-count-mismatch.error';

export class TsvFirstHeaderValidator {
  private expectedFirstHeader: string[] = [
    'Eléments du dossier',
    'Règles automatisées de gestion (pour débat) et statutaires (bloquantes)',
    'Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier',
  ];

  validate(firstRow: string[]): void {
    const headerColumns = firstRow
      .map((col) => col.trim())
      .filter((col) => col.length > 0);

    // Check if the number of columns matches the expected header
    if (headerColumns.length !== this.expectedFirstHeader.length) {
      throw new TsvHeaderCountMismatchError(
        this.expectedFirstHeader,
        headerColumns,
      );
    }

    this.expectedFirstHeader.forEach((expectedColumn, i) => {
      if (headerColumns[i] !== expectedColumn) {
        throw new TsvHeaderColumnMismatchError(
          i,
          expectedColumn,
          headerColumns[i],
        );
      }
    });
  }
}
