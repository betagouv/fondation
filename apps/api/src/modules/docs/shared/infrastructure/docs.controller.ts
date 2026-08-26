import { Body, Controller, Get, HttpStatus, Param, Post, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DocsService } from '../../docs.service';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  CreatedJusticeContactDto,
  CreateJusticeContactDto,
  FindDocsMembersQueryDto,
  FoundDocsMembersDto,
  SearchJusticeContactsQueryDto,
} from './docs.dto';
import { FoundAgendaNominationFiles } from './finders/docs-nomination-files.finder';
import { FoundJusticeContactsDto } from './queries/find-justice-contacts.query';
import { FoundSessionDocsDto } from './queries/find-session-docs.query';
import { DocGenerationSessionReadinessDto } from './queries/is-session-ready-for-doc-generation.query';
import { ListedSecretariesGeneralDto } from './queries/list-secretaries-general.query';

@ApiTags('Docs')
@Controller('/api/docs/v1')
export class DocsController {
  constructor(private readonly docs: DocsService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/secretaries-general')
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedSecretariesGeneralDto,
  })
  listSecretariesGeneral(): Promise<ListedSecretariesGeneralDto> {
    return this.docs.listSecretariesGeneral();
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundJusticeContactsDto, status: HttpStatus.OK })
  searchJusticeContact(@Query() query: SearchJusticeContactsQueryDto): Promise<FoundJusticeContactsDto> {
    return this.docs.searchJusticeContacts({ search: query.search });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/justice-contacts')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedJusticeContactDto,
  })
  createJusticeContact(
    @AuthedUser() user: { id: string },
    @Body() { name }: CreateJusticeContactDto,
  ): Promise<CreatedJusticeContactDto> {
    return this.docs.createJusticeContact({ name, authorId: user.id });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/members')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: FoundDocsMembersDto })
  findDocsMembers(@Query() query: FindDocsMembersQueryDto): Promise<FoundDocsMembersDto> {
    return this.docs.findDocsMembers(query);
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/docs')
  @ZodResponse({ type: FoundSessionDocsDto, status: HttpStatus.OK })
  findSessionDocs(@Param('sessionId') sessionId: string): Promise<FoundSessionDocsDto> {
    return this.docs.findSessionDocs({ sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/readiness')
  @ZodResponse({
    type: DocGenerationSessionReadinessDto,
    status: HttpStatus.OK,
  })
  isSessionReadyForDocGeneration(
    @Param('sessionId') sessionId: string,
  ): Promise<DocGenerationSessionReadinessDto> {
    return this.docs.isSessionReadyForDocGeneration({ sessionId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/sessions/:sessionId/files')
  @ZodResponse({ type: FoundAgendaNominationFiles, status: HttpStatus.OK })
  findAgendaNominationFiles(@Param('sessionId') sessionId: string): Promise<FoundAgendaNominationFiles> {
    return this.docs.findDocsNominationFiles({ sessionId });
  }
}
