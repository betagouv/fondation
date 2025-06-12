export class InvalidRowValueError extends Error {
  constructor(
    columnName: string,
    rowValue: string | undefined,
    rowIndex: number,
  ) {
    super(
      `Valeur invalide pour la colonne "${columnName}" : ${rowValue || 'valeur manquante'} à la ligne ${rowIndex + 1}`,
    );
    this.name = 'InvalidRowValueError';
  }
}
