import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { z } from 'zod';

import { Clock } from 'src/modules/framework/clock';
import { Id } from 'src/utils/id';

import { JwtDecoder } from './jwt-decoder';
import { OpenIdConfig } from './openid-config';
import { OpenIdAuthenticationRequest } from './openid-request';

export class InternalOpenIdService {
  constructor(
    private readonly config: OpenIdConfig,
    private readonly http: HttpService,
    private readonly clock: Clock,
  ) {}

  // TODO: SSO with prompt=never
  request(): OpenIdAuthenticationRequest {
    return OpenIdAuthenticationRequest.create({
      config: this.config,
      now: this.clock.now(),
    });
  }

  async authenticate(command: {
    code: string;
    request: {
      challenge: Buffer | null;
      nonce: Buffer;
      createdAt: Date;
      expiresAt: Date;
      id: Id<'OpenIdRequest'>;
    };
  }): Promise<{ email: string }> {
    const now = this.clock.now();

    const request = OpenIdAuthenticationRequest.from({ ...command.request, config: this.config, now });
    const tokens = await this.exchangeCode(command.code, request);
    const decoder = new JwtDecoder(this.config, request);

    const idToken = decoder.decode({
      now,
      token: tokens.id_token,
      schema: z.object({ email: z.string().optional() }),
    });

    if (idToken.email) return { email: idToken.email };

    const userInfoToken = await this.fetchUserInfo(tokens.access_token);
    const { sub, email } = decoder.decode({
      now,
      token: userInfoToken,
      schema: z.object({ email: z.string(), sub: z.string() }),
    });

    if (sub !== idToken.sub) throw new UnauthorizedException();

    return { email };
  }

  private async exchangeCode(code: string, request: OpenIdAuthenticationRequest): Promise<TokenResponse> {
    const init = request.tokenRequest(code);

    try {
      const { data } = await lastValueFrom(
        this.http.request({
          method: init.method,
          headers: init.headers,
          data: init.body,
          url: init.url.toString(),
        }),
      );

      return OpenIdTokenSchema.parseAsync(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new OpenIdHttpError(
          err.response?.config.url ?? '',
          err.response?.status,
          JSON.stringify(err.response?.data ?? ''),
        );
      }

      throw err;
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<string> {
    try {
      const { data } = await lastValueFrom(
        this.http.get<string>(this.config.endpoints.userInfo.toString(), {
          headers: { authorization: `Bearer ${accessToken}`, accept: 'application/jwt' },
          responseType: 'text',
        }),
      );

      return data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new OpenIdHttpError(
          err.request.url,
          err.response?.status,
          JSON.stringify(err.response?.data ?? ''),
        );
      }

      throw err;
    }
  }
}

const OpenIdTokenSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
});

type TokenResponse = z.infer<typeof OpenIdTokenSchema>;

class OpenIdHttpError extends Error {
  constructor(
    readonly url: string,
    readonly responseStatus: number | undefined,
    readonly responseBody: string | undefined,
  ) {
    super();
  }
}
