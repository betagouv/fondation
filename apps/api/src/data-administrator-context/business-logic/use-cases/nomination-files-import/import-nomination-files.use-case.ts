import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';
import { NominationFileContentReader } from '../../models/nomination-file-content-reader';
import { TsvParser } from '../../models/tsv-parser';

export class ImportNominationFilesUseCase {
  constructor(
    private readonly nominationFileRepository: NominationFileRepository,
  ) {}
  async execute(fileContentToImport: string): Promise<void> {
    const parsedContent = new TsvParser().parse(fileContentToImport);
    const [, secondHeader, ...content] = parsedContent;
    const contentRead = new NominationFileContentReader(
      secondHeader,
      content,
    ).read();
    const promises = contentRead.map((content) =>
      this.nominationFileRepository.save(content),
    );
    await Promise.all(promises);
  }
}
