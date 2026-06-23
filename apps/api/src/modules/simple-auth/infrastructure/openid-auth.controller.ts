import { Controller, Get, HttpStatus, Inject, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type CookieOptions, type Response as ExpressResponse } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { OpenIdProviderParam } from '../openid/openid.decorator';
import { SimpleAuthService } from '../simple-auth.service';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { OpenIdProvider } from 'src/modules/simple-auth/openid';

import { OpenIdCallbackQueryDto, PreparedOpenIdRequestDto } from './dto/openid.dto';
import { ListedOpenIdProvidersDto, ListOpenIdProvidersQuery } from './queries/list-openid-providers.query';

const SESSION_COOKIE_OPTIONS: CookieOptions = {
  signed: true,
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

@ApiTags('Auth')
@Controller('/api/auth/v2/openid')
export class OpenIdAuthController {
  private readonly logger = new Logger(OpenIdAuthController.name);

  constructor(
    private readonly auth: SimpleAuthService,
    private readonly listOpenIdProvidersQuery: ListOpenIdProvidersQuery,

    @Inject(API_CONFIG_TOKEN)
    private readonly config: ApiConfig,
  ) {}

  @Get('/providers')
  @ZodResponse({ status: HttpStatus.OK, type: ListedOpenIdProvidersDto })
  listOpenIdProviders(): ListedOpenIdProvidersDto {
    return this.listOpenIdProvidersQuery.handle();
  }

  @Post('/:provider/requests')
  @ZodResponse({ status: HttpStatus.CREATED, type: PreparedOpenIdRequestDto })
  async prepareOpenIdRequest(@OpenIdProviderParam() provider: OpenIdProvider): Promise<{ url: string }> {
    const { url } = await this.auth.openId.prepare({ provider });
    return { url: url.toString() };
  }

  /** @warning this is the OIDC callback, and SHOULD be a GET request */
  @Get('/:provider/callback')
  async callback(
    @Query() query: OpenIdCallbackQueryDto,
    @OpenIdProviderParam() provider: OpenIdProvider,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const redirect = new URL('/login', this.config.frontendOriginUrl);
    try {
      const { code, state } = query;
      const session = await this.auth.openId.login({ code, state, provider });
      res.cookie('sessionId', session.id, { ...SESSION_COOKIE_OPTIONS, expires: session.expiresAt });
    } catch (error) {
      this.logger.error('Error while login with openid', error);
      redirect.searchParams.set('error', 'true');
    }

    res.redirect(redirect.toString());
  }
}
