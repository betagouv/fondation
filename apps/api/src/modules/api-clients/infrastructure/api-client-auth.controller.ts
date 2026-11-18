import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { type Request as ExpressRequest } from 'express';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiClientsService } from '../api-clients.service';
import { ApiClientForbidden, ApiClientUnauthenticated } from '../domain/api-client';

import {
  AuthenticateApiClientDto,
  AuthenticateApiClientRefusedDto,
  AuthenticatedApiClientDto,
} from './api-client.dto';

@ApiTags('ApiClients')
@Controller('/api/public/v1')
export class ApiClientAuthController {
  constructor(private readonly apiClients: ApiClientsService) {}

  @Post('/auth')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  @ApiConsumes('application/x-www-form-urlencoded')
  @ZodResponse({ status: HttpStatus.OK, type: AuthenticatedApiClientDto })
  @ZodResponse<any>({ status: HttpStatus.UNAUTHORIZED, type: AuthenticateApiClientRefusedDto })
  @ZodResponse<any>({ status: HttpStatus.FORBIDDEN, type: AuthenticateApiClientRefusedDto })
  async authenticateApiClient(
    @Body() body: AuthenticateApiClientDto,
    @Req() request: ExpressRequest,
  ): Promise<AuthenticatedApiClientDto> {
    try {
      const { accessToken, expiresIn } = await this.apiClients.authenticate({
        clientId: body.client_id,
        clientSecret: body.client_secret,
        ip: request.ip ?? 'unknown',
      });

      return { access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn };
    } catch (error) {
      // The errors of this route alone follow OAuth 2.0, which the partner's library expects
      if (error instanceof ApiClientUnauthenticated)
        throw new UnauthorizedException({ error: 'invalid_client' });
      if (error instanceof ApiClientForbidden) throw new ForbiddenException({ error: 'access_denied' });
      throw error;
    }
  }
}
