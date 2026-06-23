import { createPublicKey, KeyObject, verify as verifySignature } from 'node:crypto';

import z from 'zod';

import { SECONDS } from 'src/utils/time';

import { OpenIdConfig } from './openid-config';
import { OpenIdAuthenticationRequest } from './openid-request';
import { Jwk } from './openid.schema';

export abstract class JwtError extends Error {}
export class JwtMalformed extends JwtError {}
export class JwtInvalidSignature extends JwtError {}
export class JwtInvalidNonce extends JwtError {}
export class JwtExpired extends JwtError {}
export class JwtUnsupportedAlgorithm extends JwtError {
  constructor(readonly algorithm: string) {
    super();
  }
}

export class JwtUnknownKey extends JwtError {
  constructor(readonly kid: string | undefined) {
    super();
  }
}

export class JwtUnexpectedIssuer extends JwtError {
  constructor(
    readonly provided: string,
    readonly expected: string,
  ) {
    super();
  }
}

export class JwtDecoder {
  private static readonly DIGESTS: Record<string, string> = {
    RS256: 'sha256',
    ES256: 'sha256',
  };

  private readonly issuer: string;
  private readonly keys: readonly Jwk[];
  private readonly expectedNonce: Buffer;

  constructor(config: OpenIdConfig, request: OpenIdAuthenticationRequest) {
    this.keys = config.keys;
    this.issuer = config.issuer;
    this.expectedNonce = request.state.nonce;
  }

  decode<T extends Record<string, unknown> = {}>(options: {
    token: string;
    now: Date;
    schema?: z.ZodType<T>;
  }): JwtPayload & Omit<T, 'iss' | 'exp' | 'nonce'> {
    const [rawHeader, rawPayload, rawSignature] = options.token.split('.');
    if (!rawHeader || !rawPayload || !rawSignature) {
      throw new JwtMalformed();
    }

    this.assertSignature([rawHeader, rawPayload, rawSignature]);
    return this.assertWithClaims(rawPayload, options.now, options.schema);
  }

  private assertSignature([rawHeader, rawPayload, rawSignature]: [
    header: string,
    payload: string,
    signature: string,
  ]): void {
    const { publicKey, algorithm } = this.getKey(rawHeader);

    const isValid = verifySignature(
      algorithm,
      Buffer.from(`${rawHeader}.${rawPayload}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(rawSignature, 'base64url'),
    );

    if (!isValid) throw new JwtInvalidSignature();
  }

  private getKey(rawHeader: string): { publicKey: KeyObject; algorithm: string } {
    const header = JwtDecoder.parse(rawHeader, JwtHeaderSchema);

    const algorithm = JwtDecoder.DIGESTS[header.alg];
    if (!algorithm) throw new JwtUnsupportedAlgorithm(header.alg);

    const key = header.kid ? this.keys.find(({ kid }) => kid === header.kid) : this.keys[0];
    if (!key) throw new JwtUnknownKey(header.kid);

    return { publicKey: createPublicKey({ key, format: 'jwk' }), algorithm: algorithm };
  }

  private assertWithClaims<T extends Record<string, unknown> = {}>(
    rawPayload: string,
    now: Date,
    schema: z.ZodType<T> | undefined,
  ): JwtPayload & Omit<T, 'iss' | 'exp' | 'nonce'> {
    const payload = JwtDecoder.parse(
      rawPayload,
      schema instanceof z.ZodObject ? JwtPayloadSchema.and(schema) : JwtPayloadSchema,
    );

    if (this.issuer !== payload.iss) {
      throw new JwtUnexpectedIssuer(payload.iss, this.issuer);
    }

    if (payload.nonce && this.expectedNonce.toString('base64url') !== payload.nonce) {
      throw new JwtInvalidNonce();
    }

    if (typeof payload.exp !== 'number' || payload.exp * SECONDS <= now.getTime()) {
      throw new JwtExpired();
    }

    return payload as any;
  }

  private static parse<T extends Record<string, unknown>>(b64: string, schema: z.ZodType<T>): T {
    return schema.parse(JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')));
  }
}

const JwtHeaderSchema = z.looseObject({ alg: z.string().nonempty(), kid: z.string().optional() });
const JwtPayloadSchema = z.looseObject({
  exp: z.number().gt(0),
  iss: z.string().nonempty(),
  nonce: z.base64url().optional(),
});

type JwtPayload = z.infer<typeof JwtPayloadSchema>;
