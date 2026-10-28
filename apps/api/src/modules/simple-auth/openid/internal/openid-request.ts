import { createHash, randomBytes } from 'node:crypto';

import { Id, makeId } from '../../../../utils/id';
import * as time from '../../../../utils/time';
import { OpenIdProvider } from '../openid.provider';

import { OPENID_CODE_CHALLENGE_METHOD, OpenIdConfig } from './openid-config';

type OpenIdRequestState = {
  nonce: Buffer;
  challenge: OpenIdPkceChallenge;
  createdAt: Date;
  expiresAt: Date;
};

export class OpenIdAuthenticationRequest {
  private static REQUEST_DURATION = 10 * time.MINUTES;
  private static readonly RESPONSE_TYPE = 'code';

  get provider(): OpenIdProvider {
    return this.config.id as any;
  }

  private constructor(
    readonly id: Id<'OpenIdRequest'>,
    readonly config: OpenIdConfig,
    readonly state: OpenIdRequestState,
  ) {}

  get authorizationUrl(): URL {
    const url = new URL(this.config.endpoints.authorization);
    url.search =
      '?' +
      new URLSearchParams({
        state: this.id,
        nonce: this.state.nonce.toString('base64url'),
        response_type: OpenIdAuthenticationRequest.RESPONSE_TYPE,
        client_id: this.config.clientId,
        redirect_uri: this.config.urls.redirect.toString(),
        scope: this.config.scopes.join(' '),
        code_challenge: this.state.challenge.toHashString(),
        code_challenge_method: this.state.challenge.method,
      }).toString();

    if (this.config.claims) url.searchParams.set('claims', this.config.claims.toString());
    if (this.config.acr) url.searchParams.set('acr_values', this.config.acr);

    return url;
  }

  tokenRequest(code: string) {
    const url = new URL(this.config.endpoints.token);
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: this.state.challenge.toString(),
      redirect_uri: this.config.urls.redirect.toString(),
    });

    return {
      url,
      method: 'post',
      body: body.toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    };
  }

  static create(props: { now: Date; config: OpenIdConfig }): OpenIdAuthenticationRequest {
    const expiresAt = new Date(props.now.getTime() + this.REQUEST_DURATION);
    const state: OpenIdRequestState = {
      challenge: OpenIdPkceChallenge.create(),
      expiresAt,
      createdAt: props.now,
      nonce: randomBytes(32),
    };

    return new OpenIdAuthenticationRequest(makeId('OpenIdRequest'), props.config, state);
  }

  static from(props: {
    challenge: Buffer;
    nonce: Buffer;
    createdAt: Date;
    expiresAt: Date;
    now: Date;
    config: OpenIdConfig;
    id: Id<'OpenIdRequest'>;
  }): OpenIdAuthenticationRequest {
    const { challenge, config, ...state } = props;

    if (props.expiresAt.getTime() <= props.now.getTime()) {
      throw new OpenIdAuthenticationRequestExpired(
        props.config.id as OpenIdProvider,
        props.id,
        props.expiresAt,
      );
    }

    return new OpenIdAuthenticationRequest(props.id, config, {
      ...state,
      challenge: OpenIdPkceChallenge.from(challenge),
    });
  }
}

class OpenIdPkceChallenge {
  private static readonly CHALLENGE_SIZE = 32;

  readonly method = OPENID_CODE_CHALLENGE_METHOD;

  private constructor(private readonly buffer: Buffer) {}

  toBuffer(): Buffer {
    return this.buffer;
  }

  toString(): string {
    return this.buffer.toString('base64url');
  }

  toHashString(): string {
    return OpenIdPkceChallenge.hash(this.buffer);
  }

  isValid(challenge: string): boolean {
    return this.toHashString() === challenge;
  }

  static from(verifier: Buffer) {
    return new OpenIdPkceChallenge(verifier);
  }

  static create(): OpenIdPkceChallenge {
    return this.from(randomBytes(this.CHALLENGE_SIZE));
  }

  private static hash(value: Buffer): string {
    return createHash('sha256').update(value).digest('base64url');
  }
}

export class OpenIdAuthenticationRequestExpired extends Error {
  constructor(
    readonly provider: OpenIdProvider,
    readonly id: Id<'OpenIdRequest'>,
    readonly expiredAt: Date,
  ) {
    super();
  }
}
