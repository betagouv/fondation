import { Injectable } from '@nestjs/common';
import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from '../finders/agenda-nomination-files.finder';

@Injectable()
export class FindAgendaNominationFilesQuery {
  constructor(private readonly nominationFiles: AgendaNominationFilesFinder) {}

  async handle(query: {
    sessionId: string;
  }): Promise<FoundAgendaNominationFiles> {
    return this.nominationFiles.find(query);
  }
}
