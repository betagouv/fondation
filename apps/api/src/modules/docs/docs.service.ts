import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Db } from '../framework/database';
import { MembersService } from '../members';
import { TransparenceService } from '../session/transparence/infrastructure/transparence.service';
import { FormationEnum } from '../shared/formation.enum';

import { AgendasService } from './agenda/agendas.service';
import { OfficialReportsService } from './official-report/official-reports.service';
import { PresentationPlansService } from './presentation-plan/presentation-plans.service';
import { FoundDocsMembersDto } from './shared/infrastructure/docs.dto';
import {
  DocsNominationFilesFinder,
  FoundAgendaNominationFiles,
} from './shared/infrastructure/finders/docs-nomination-files.finder';
import {
  NominationFileLinkedDoc,
  NominationFilesLinkedDocsFinder,
} from './shared/infrastructure/finders/nomination-files-linked-docs.finder';
import {
  FindJusticeContactsQuery,
  FoundJusticeContactsDto,
} from './shared/infrastructure/queries/find-justice-contacts.query';
import {
  FindSessionDocsQuery,
  FoundSessionDocsDto,
} from './shared/infrastructure/queries/find-session-docs.query';
import {
  DocGenerationSessionReadinessDto,
  IsSessionReadyForDocGenerationQuery,
} from './shared/infrastructure/queries/is-session-ready-for-doc-generation.query';
import {
  ListedSecretariesGeneralDto,
  ListSecretariesGeneralQuery,
} from './shared/infrastructure/queries/list-secretaries-general.query';

@Injectable()
export class DocsService {
  constructor(
    readonly agendas: AgendasService,
    readonly officialReports: OfficialReportsService,
    readonly presentationPlans: PresentationPlansService,

    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,

    private readonly findJusticeContactsQuery: FindJusticeContactsQuery,
    private readonly findSessionDocsQuery: FindSessionDocsQuery,
    private readonly isSessionReadyForDocGenerationQuery: IsSessionReadyForDocGenerationQuery,
    private readonly nominationFilesLinkedDocsFinder: NominationFilesLinkedDocsFinder,
    private readonly listSecretariesGeneralQuery: ListSecretariesGeneralQuery,
    private readonly db: Db,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  findSessionDocs(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    return this.findSessionDocsQuery.handle(query);
  }

  isSessionReadyForDocGeneration(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    return this.isSessionReadyForDocGenerationQuery.handle(query);
  }

  listSecretariesGeneral(): Promise<ListedSecretariesGeneralDto> {
    return this.listSecretariesGeneralQuery.handle();
  }

  searchJusticeContacts(query: { search: string }): Promise<FoundJusticeContactsDto> {
    return this.findJusticeContactsQuery.handle(query);
  }

  async createJusticeContact(command: {
    name: string;
    authorId: string;
  }): Promise<{ id: string; name: string }> {
    const result = await this.db.tx.justiceDepartmentContact.create({
      data: { name: command.name, authorId: command.authorId },
    });

    return { id: String(result.id), name: result.name };
  }

  async findDocsMembers(query: { formation: FormationEnum }): Promise<FoundDocsMembersDto> {
    const items = await this.members.internalFindMembersByFormation(query);
    return { items: items.map(({ role: _r, ...m }) => m) };
  }

  findDocsNominationFiles(query: { sessionId: string }): Promise<FoundAgendaNominationFiles> {
    return this.docsNominationFilesFinder.findForAgenda(query);
  }

  internalFindNominationFilesLinkedDocs(query: {
    nominationFileIds: Set<string>;
  }): Promise<Map<string, NominationFileLinkedDoc[]>> {
    return this.nominationFilesLinkedDocsFinder.find(query);
  }
}
