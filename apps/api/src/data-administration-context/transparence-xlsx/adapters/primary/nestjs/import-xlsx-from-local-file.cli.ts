import { basename } from 'path';
import { DateOnlyJson, Magistrat } from 'shared-models';
import { ImportTransparenceXlsxUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-transparence-xlsx/import-transparence-xlsx.use-case';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';

export class ImportXlsxFileFromLocalFileCli {
  constructor(
    private readonly fileReader: FileReaderProvider,
    private readonly importTransparenceXlsxUseCase: ImportTransparenceXlsxUseCase,
  ) {}

  async execute(
    absoluteFilePath: string,
    formation: Magistrat.Formation,
    nomTransparence: string,
    dateTransparence: DateOnlyJson,
    dateEchéance: DateOnlyJson,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson | null,
  ): Promise<void> {
    const fileContent =
      await this.fileReader.readFromAbsolutePath(absoluteFilePath);
    const fileName = basename(absoluteFilePath);
    const file = new File([fileContent], fileName);

    await this.importTransparenceXlsxUseCase.execute(
      file,
      formation,
      nomTransparence,
      dateTransparence,
      dateEchéance,
      datePriseDePosteCible,
      dateClôtureDélaiObservation,
    );
  }
}
