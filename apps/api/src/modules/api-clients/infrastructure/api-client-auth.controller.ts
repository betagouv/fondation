import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseFilters, UsePipes } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { type Request as ExpressRequest } from 'express';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiClientsService } from '../api-clients.service';

import {
  AuthenticateApiClientDto,
  AuthenticateApiClientRefusedDto,
  AuthenticatedApiClientDto,
} from './api-client.dto';
import { OAuthErrorFilter } from './oauth-error.filter';

@ApiTags('ApiClients')
@Controller('/api/public/v1')
export class ApiClientAuthController {
  constructor(private readonly apiClients: ApiClientsService) {}

  @Post('/auth')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ZodValidationPipe)
  @ApiConsumes('application/x-www-form-urlencoded')
  @ZodResponse({ status: HttpStatus.OK, type: AuthenticatedApiClientDto })
  @ZodResponse<any>({ status: HttpStatus.BAD_REQUEST, type: AuthenticateApiClientRefusedDto })
  @ZodResponse<any>({ status: HttpStatus.UNAUTHORIZED, type: AuthenticateApiClientRefusedDto })
  @ZodResponse<any>({ status: HttpStatus.FORBIDDEN, type: AuthenticateApiClientRefusedDto })
  @UseFilters(OAuthErrorFilter)
  async authenticateApiClient(
    @Body() body: AuthenticateApiClientDto,
    @Req() request: ExpressRequest,
  ): Promise<AuthenticatedApiClientDto> {
    const { accessToken, expiresIn } = await this.apiClients.authenticate({
      clientId: body.client_id,
      clientSecret: body.client_secret,
      ip: request.ip ?? 'unknown',
    });

    return { access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn };
  }
}
