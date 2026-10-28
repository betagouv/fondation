import { Body, Controller, HttpStatus, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AdministrationService } from '../administration.service';

import { AdministrationErrorMapper } from './administration.filter';
import { RegisteredUserDto, RegisterUserDto } from './dto/administration.dto';
import { DevelopmentEnvironmentGuard } from './guards/development-environment.guard';

@ApiTags('Auth')
@ApiExtraModels(RegisterUserDto, RegisteredUserDto)
@Controller('/api/auth/v2')
@UseInterceptors(AdministrationErrorMapper)
export class RegistrationController {
  constructor(private readonly administration: AdministrationService) {}

  @Post('register')
  @ApiExcludeEndpoint()
  @UsePipes(ZodValidationPipe)
  @UseGuards(DevelopmentEnvironmentGuard)
  @ZodResponse({ status: HttpStatus.CREATED, type: RegisteredUserDto })
  registerUser(@Body() body: RegisterUserDto): Promise<RegisteredUserDto> {
    return this.administration.registerUser({
      ...body,
      isAdmin: body.isAdmin ?? false,
      role: body.role ?? 'MEMBRE_COMMUN',
    });
  }
}
