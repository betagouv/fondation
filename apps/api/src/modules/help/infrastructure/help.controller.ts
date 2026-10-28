import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_EXTENSIONS, Multipart, UseMultipartBody } from '../../framework/files';
import type { RoleEnum } from '../../shared/role.enum';
import { AuthedUser, HasRole } from '../../simple-auth';
import { HELP_PAGES, type HelpPageEnum } from '../domain/help-page';
import { HelpService } from '../help.service';

import {
  IncludedFilesInHelpPageContentDto,
  IncludeFilesInHelpPageContentDto,
  VIDEO_MAX_BYTES,
  WriteHelpPageContentDto,
} from './help.dto';
import { DetailedHelpPageDto } from './queries/detail-help-page.query';

@ApiTags('Help')
@ApiParam({ enum: HELP_PAGES, enumName: 'HelpPageEnum', name: 'page' })
@Controller('/api/help/v1/pages/:page')
export class HelpController {
  constructor(private readonly help: HelpService) {}

  @Get()
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: DetailedHelpPageDto })
  detailHelpPage(
    @AuthedUser() user: { role: RoleEnum },
    @Param('page', new ParseEnumPipe(HELP_PAGES)) page: HelpPageEnum,
  ): Promise<DetailedHelpPageDto> {
    return this.help.detailHelpPage({ page, user });
  }

  @Post('/screenshots')
  @HasRole('ADMIN')
  @UseMultipartBody({
    destination: ({ request, id, mimetype }) => {
      // the pipes run after the upload: the page is checked here, before the file reaches the storage
      const { page } = request.params;
      if (!HELP_PAGES.includes(page as HelpPageEnum)) throw new BadRequestException();

      return `help/${page}/${id}.${FILE_EXTENSIONS[mimetype]}`;
    },
    maxFileBytes: VIDEO_MAX_BYTES,
    schema: IncludeFilesInHelpPageContentDto,
  })
  @ZodResponse({ status: HttpStatus.OK, type: IncludedFilesInHelpPageContentDto })
  includeFilesInHelpPageContent(
    @Param('page', new ParseEnumPipe(HELP_PAGES)) page: HelpPageEnum,
    @Body() { files }: Multipart<typeof IncludeFilesInHelpPageContentDto>,
  ): Promise<IncludedFilesInHelpPageContentDto> {
    return this.help.includeFilesIntoContent({ files, page });
  }

  @Put('/content')
  @HasRole('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  writeHelpPageContent(
    @AuthedUser() user: { id: string },
    @Param('page', new ParseEnumPipe(HELP_PAGES)) page: HelpPageEnum,
    @Body() body: WriteHelpPageContentDto,
  ): Promise<void> {
    return this.help.writeContent({ content: body.content, editorId: user.id, page });
  }
}
