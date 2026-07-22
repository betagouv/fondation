import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiProduces, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  CreatedJusticePresentationPlanDto,
  CreateOrUpdateJusticePresentationPlanDto,
  PresentPlanDto,
} from './infrastructure/presentation-plans.dto';
import { PresentationPlansFilter } from './infrastructure/presentation-plans.filter';
import { DetailedPresentationPlanMetadataDto } from './infrastructure/queries/details-presentation-plan-metadata.query';
import { DetailedPresentationPlanPdfDocumentDto } from './infrastructure/queries/details-presentation-plan-pdf-document.query';
import { ListedNonPresentedPlansDto } from './infrastructure/queries/list-non-presented-plans.query';
import { ListedPresentedPlansDto } from './infrastructure/queries/list-presented-plans.query';
import { PresentationPlansService } from './presentation-plans.service';

@ApiTags('Docs')
@Controller('/api/docs/v1')
@UseInterceptors(PresentationPlansFilter)
export class PresentationPlansController {
  constructor(private readonly presentationPlans: PresentationPlansService) {}

  @Get('/presentation-plans/agendas')
  @ApiQuery({ name: 'ignore', required: false, type: 'string', format: 'uuid' })
  @ZodResponse({ status: HttpStatus.OK, type: FoundAgendasDto })
  listPresentationPlanAgendas(
    @Query('ignore', new ParseUUIDPipe({ optional: true }))
    ignorePlanId: string | undefined,
  ): Promise<FoundAgendasDto> {
    return this.presentationPlans.findPresentationPlanAgendas({ ignorePlanId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans/:planId.html')
  @ApiProduces('text/html')
  @ApiResponse({ content: { 'text/html': {} } })
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  generatePresentationPlanHtml(
    @Param('planId') planId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<string> {
    return this.presentationPlans.findPresentationPlanDocument({
      forceNew,
      id: planId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans/:planId.pdf')
  @ApiProduces(FILE_MIME_TYPES.pdf)
  @ApiQuery({ name: 'force', type: 'boolean', required: false, default: false })
  generatePresentationPlanPdf(
    @Param('planId') planId: string,
    @Query('force', new ParseBoolPipe({ optional: true }), new DefaultValuePipe(false))
    forceNew: boolean,
  ): Promise<StreamableFile> {
    return this.presentationPlans.findPresentationPlanDocumentPdf({
      forceNew,
      id: planId,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans/presented')
  @ApiPaginated()
  @ZodResponse({ type: ListedPresentedPlansDto, status: HttpStatus.OK })
  listPresentedPlans(@QueryPagination() pagination: Pagination): Promise<ListedPresentedPlansDto> {
    return this.presentationPlans.listPresentedPlans({ pagination });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans/:planId')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedPresentationPlanMetadataDto,
  })
  detailsPresentationPlanMetadata(
    @Param('planId') planId: string,
  ): Promise<DetailedPresentationPlanMetadataDto> {
    return this.presentationPlans.detailsPresentationPlanMetadata({ id: planId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Post('/presentation-plans')
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedJusticePresentationPlanDto,
  })
  @UsePipes(ZodValidationPipe)
  createJusticePresentationPlan(
    @Body() body: CreateOrUpdateJusticePresentationPlanDto,
    @AuthedUser() user: { id: string },
  ): Promise<CreatedJusticePresentationPlanDto> {
    return this.presentationPlans.createPresentationPlan({ ...body, authorId: user.id });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/presentation-plans/:planId')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateJusticePresentationPlan(
    @Param('planId') planId: string,
    @Body() body: CreateOrUpdateJusticePresentationPlanDto,
    @AuthedUser() user: { id: string },
  ): Promise<void> {
    return this.presentationPlans.updatePresentationPlan({
      ...body,
      id: planId,
      authorId: user.id,
      endingTime: body.endingTime ?? null,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans/:planId/url')
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedPresentationPlanPdfDocumentDto,
  })
  detailsJusticePresentationPlanPdfDocument(
    @Param('planId') planId: string,
  ): Promise<DetailedPresentationPlanPdfDocumentDto> {
    return this.presentationPlans.detailsPresentationPlanPdfDocument({ id: planId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Patch('/presentation-plans/:planId/html')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: { html: { contentType: 'text/html' } },
          schema: { type: 'object', properties: { html: { type: 'string', format: 'binary' } } },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('html', {
      limits: { fileSize: 5_242_880 /* 5Mo */ },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'text/html'),
    }),
  )
  updatePresentationPlanHtml(
    @Param('planId') planId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.presentationPlans.updatePresentationPlanHtml({ id: planId, html: file.buffer });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/presentation-plans/:planId/document')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPresentationPlanDocument(@Param('planId') planId: string): Promise<void> {
    return this.presentationPlans.resetPresentationPlanDocument({ id: planId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/presentation-plans/:planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJusticePresentationPlan(@Param('planId') planId: string): Promise<void> {
    return this.presentationPlans.deletePresentationPlan({ id: planId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/presentation-plans')
  @ZodResponse({ type: ListedNonPresentedPlansDto, status: HttpStatus.OK })
  listNonPresentedPlans(): Promise<ListedNonPresentedPlansDto> {
    return this.presentationPlans.listNonPresentedPlans();
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/presentation-plans/:planId/presentation')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  presentPlan(@Param('planId') planId: string, @Body() body: PresentPlanDto): Promise<void> {
    return this.presentationPlans.presentPlan({ id: planId, endTime: body.endTime });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Delete('/presentation-plans/:planId/presentation')
  @HttpCode(HttpStatus.NO_CONTENT)
  unPresentPlan(@Param('planId') planId: string): Promise<void> {
    return this.presentationPlans.unPresentPlan({ id: planId });
  }
}
