import { createHash, randomBytes } from 'node:crypto';

import { OpenIdProvider } from '../openid.provider';
import { Id, makeId } from 'src/utils/id';
import * as time from 'src/utils/time';

import { OpenIdConfig } from './openid-config';

type OpenIdRequestState = {
  nonce: Buffer;
  challenge: OpenIdPkceChallenge | null;
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
      }).toString();

    if (this.config.claims) url.searchParams.set('claims', this.config.claims.toString());
    if (this.config.acr) url.searchParams.set('acr_values', this.config.acr);
    if (this.state.challenge) {
      url.searchParams.set('code_challenge', this.state.challenge.toHashString());
      url.searchParams.set('code_challenge_method', this.state.challenge.method);
    }

    return url;
  }

  tokenRequest(code: string) {
    const url = new URL(this.config.endpoints.token);
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      redirect_uri: this.config.urls.redirect.toString(),
    });

    if (this.state.challenge) {
      body.set('code_verifier', this.state.challenge.toString());
    } else {
      body.set('client_secret', this.config.clientSecret);
    }

    return {
      url,
      method: 'post',
      body: body.toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    };
  }

  static create(props: { now: Date; config: OpenIdConfig }): OpenIdAuthenticationRequest {
    const expiresAt = new Date(props.now.getTime() + this.REQUEST_DURATION);
    const challenge = OpenIdPkceChallenge.create(props.config);

    const state: OpenIdRequestState = {
      challenge,
      expiresAt,
      createdAt: props.now,
      nonce: randomBytes(32),
    };

    return new OpenIdAuthenticationRequest(makeId('OpenIdRequest'), props.config, state);
  }

  static from(props: {
    challenge: Buffer | null;
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
      challenge: challenge ? OpenIdPkceChallenge.from(challenge) : null,
    });
  }
}

// this requires `$.code_challenge_methods_supported.includes('S256)` in .well-known
class OpenIdPkceChallenge {
  private static readonly CHALLENGE_SIZE = 32;

  private static method = 'S256';
  readonly method = OpenIdPkceChallenge.method;

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

  static create(config: OpenIdConfig): OpenIdPkceChallenge | null {
    if (config.enableCodeChallenge === false || !config.supportedCodeChallengeMethods?.has(this.method)) {
      return null;
    }
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
