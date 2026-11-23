import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthedUser, HasRole } from '../../simple-auth';
import { ApiClientsService } from '../api-clients.service';

import {
  CreateApiClientDto,
  CreatedApiClientDto,
  RotateApiClientSecretDto,
  RotatedApiClientSecretDto,
} from './api-client.dto';
import { ApiClientsErrorMapper } from './api-clients.filter';
import { ListedApiClientsDto } from './queries/list-api-clients.query';

/** Each action also checks canManageApiClients: the admin right alone is not enough */
@ApiTags('ApiClients')
@Controller('/api/administration/v1/api-clients')
@UseInterceptors(ApiClientsErrorMapper)
export class ApiClientsAdministrationController {
  constructor(private readonly apiClients: ApiClientsService) {}

  @HasRole('ADMIN')
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListedApiClientsDto })
  listApiClients(@AuthedUser() actor: { id: string }): Promise<ListedApiClientsDto> {
    return this.apiClients.list({ actorId: actor.id });
  }

  @HasRole('ADMIN')
  @Post()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedApiClientDto })
  createApiClient(
    @AuthedUser() actor: { id: string },
    @Body() body: CreateApiClientDto,
  ): Promise<CreatedApiClientDto> {
    return this.apiClients.create({
      actorId: actor.id,
      allowedIps: body.allowedIps.map(({ ip }) => ip),
      name: body.name,
      scopes: body.scopes.map(({ id }) => id),
    });
  }

  @HasRole('ADMIN')
  @Post('/:clientId/secret-rotation')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.CREATED, type: RotatedApiClientSecretDto })
  async rotateApiClientSecret(
    @AuthedUser() actor: { id: string },
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() body: RotateApiClientSecretDto,
  ): Promise<RotatedApiClientSecretDto> {
    const { previousValidUntil, secret } = await this.apiClients.rotateSecret({
      actorId: actor.id,
      clientId,
      days: body.days,
    });

    return { previousSecretValidUntil: previousValidUntil.toISOString(), secret };
  }

  @HasRole('ADMIN')
  @Delete('/:clientId/secret-rotation')
  @HttpCode(HttpStatus.NO_CONTENT)
  endApiClientSecretRotation(
    @AuthedUser() actor: { id: string },
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<void> {
    return this.apiClients.endSecretRotation({ actorId: actor.id, clientId });
  }

  @HasRole('ADMIN')
  @Put('/:clientId/revocation')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeApiClient(
    @AuthedUser() actor: { id: string },
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<void> {
    return this.apiClients.revoke({ actorId: actor.id, clientId });
  }
}
