import { ImportNominationFilesUseCase } from 'src/data-administration-context/transparence-tsv/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';

export class ImportNominationFileFromLocalFileCli {
  constructor(
    private readonly fileReader: FileReaderProvider,
    private readonly importNominationFilesUseCase: ImportNominationFilesUseCase,
  ) {}

  async execute(absoluteFilePath: string): Promise<void> {
    const file = await this.fileReader.readFromAbsolutePath(absoluteFilePath);
    await this.importNominationFilesUseCase.execute(file.toString());
  }
}
