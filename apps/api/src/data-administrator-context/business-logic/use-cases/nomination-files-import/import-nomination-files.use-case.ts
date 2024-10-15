import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';
import { NominationFileContentReader } from '../../models/nomination-file-content-reader';
import { TsvFirstHeaderValidator } from '../../models/tsv-first-header-validator';
import { TsvParser } from '../../models/tsv-parser';

export class ImportNominationFilesUseCase {
  constructor(
    private readonly nominationFileRepository: NominationFileRepository,
  ) {}
  async execute(fileContentToImport: string): Promise<void> {
    const parsedContent = new TsvParser().parse(fileContentToImport);

    if (!parsedContent.length) throw new Error('Empty file');
    new TsvFirstHeaderValidator().validate(parsedContent[0]!);

    if (parsedContent.length >= 2) {
      const contentRead = new NominationFileContentReader().read(parsedContent);
      const promises = contentRead.map((content) =>
        this.nominationFileRepository.save(content),
      );
      await Promise.all(promises);
    }
  }
}
