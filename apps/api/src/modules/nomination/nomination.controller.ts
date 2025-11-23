import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Role } from 'shared-models';
import { HasRole } from '../simple-auth';
import { AffectationService } from './affectation.service';
import { AutoAffectationDto } from './infrastructure/dtos/auto-affectation.dto';
import { SessionExceptionFilter } from '../session/infrastructure/session.filter';

@UseInterceptors(SessionExceptionFilter)
@Controller('/api/nominations')
export class NominationController {
  constructor(private readonly affectationService: AffectationService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/:sessionId/auto-affectation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  async autoAffectation(
    @Param('sessionId') sessionId: string,
    @Body() body: AutoAffectationDto,
  ): Promise<void> {
    await this.affectationService.autoAffectation(
      sessionId,
      body.nominationFileIds,
    );
  }
}
