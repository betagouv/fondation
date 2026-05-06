import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { createZodDto, ZodResponse, ZodValidationPipe } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { DevelopmentEnvironmentGuard } from 'src/modules/simple-auth/infrastructure/guards/development-environment.guard';
import { DateOnly } from 'src/utils/date-only';

import { gradeEnumToSortableTargetedGrade } from './repositories/sortable-targeted-grade';
import { SessionsTestService } from './sessions.test-service';

export class CreateSessionTestDto extends createZodDto(
  z.object({
    name: z.string(),
    typeDeSaisine: z.enum(TypeDeSaisine),
    formation: z.enum(Magistrat.Formation),
    date: dateOnlyJsonSchema.transform((json) => DateOnly.fromJson(json)),
    observationClosingDate: dateOnlyJsonSchema
      .nullable()
      .transform((json) => (json ? DateOnly.fromJson(json) : null)),
    dueDate: dateOnlyJsonSchema.nullable().transform((json) => (json ? DateOnly.fromJson(json) : null)),
    positionStartDate: dateOnlyJsonSchema
      .nullable()
      .transform((json) => (json ? DateOnly.fromJson(json) : null)),
    lolfiSessionId: z.number().int().gte(0).nullable(),
  }),
) {}

export class CreatedSessionTestDto extends createZodDto(z.object({ id: z.string() })) {}

export class AssociateNominationFilesToSessionTestDto extends createZodDto(
  z.object({
    files: z.array(
      z
        .object({
          fileNumber: z.number(),
          name: z.string(),
          rank: z.string().nullable(),
          grade: z.enum(Magistrat.Grade),
          targetedGrade: z.enum(Magistrat.Grade),
          targetedPosition: z.string(),
          birthDate: dateOnlyJsonSchema
            .nullable()
            .transform((json) => (json ? DateOnly.fromJson(json) : null)),
          currentPosition: z.string(),
          lastPositionDate: dateOnlyJsonSchema
            .nullable()
            .transform((json) => (json ? DateOnly.fromJson(json) : null)),
          lastRankingDate: dateOnlyJsonSchema
            .nullable()
            .transform((json) => (json ? DateOnly.fromJson(json) : null)),
          biography: z.string().nullable(),
          careerInformation: z.string().nullable(),
          detectedMagistratId: z.string().nullable(),
          detectedJurisdictionId: z.string().nullable(),
          detectedTargetedFunctionId: z.string().nullable(),
          detectedTargetedPositionId: z.number().int().gte(0).nullable(),
        })
        .transform((x) => ({
          ...x,
          sortableTargetedGrade: gradeEnumToSortableTargetedGrade(x.targetedGrade),
        })),
    ),
  }),
) {}

/**
 * this controller is intended for client e2e tests
 */
@Controller('/_/sessions')
@ApiExcludeController()
@UseGuards(DevelopmentEnvironmentGuard)
export class SessionTestController {
  constructor(private sessions: SessionsTestService) {}

  @Post()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedSessionTestDto })
  createSession(@Body() body: CreateSessionTestDto): Promise<CreatedSessionTestDto> {
    return this.sessions.create(body);
  }

  @Put('/:sessionId/files')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async associateNominationFiles(
    @Param('sessionId') sessionId: string,
    @Body() { files }: AssociateNominationFilesToSessionTestDto,
  ): Promise<void> {
    await this.sessions.associateNominationFiles({
      files,
      sessionId,
    });
  }
}
