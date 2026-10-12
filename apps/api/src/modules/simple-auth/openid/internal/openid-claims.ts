import { Logger } from '@nestjs/common';
import z from 'zod';

const OpenIdClaimsSchema = z.partialRecord(
  z.enum(['userinfo', 'id_token']),
  z.record(
    z.string(),
    z.union([
      z.null(),
      z.object({ essential: z.boolean(), values: z.array(z.string()).nonempty().optional() }),
    ]),
  ),
);

type RawOpenIdClaims = z.infer<typeof OpenIdClaimsSchema>;

export class OpenIdClaims {
  static schema = OpenIdClaimsSchema;

  private readonly logger = new Logger(OpenIdClaims.name);
  private constructor(private readonly claims: RawOpenIdClaims) {}

  static from(claims: {}): OpenIdClaims {
    return new OpenIdClaims(
      OpenIdClaimsSchema.parse(typeof claims === 'string' ? JSON.parse(claims) : claims),
    );
  }

  toJSON(): RawOpenIdClaims {
    return this.claims;
  }

  toString(): string {
    return JSON.stringify(this.claims);
  }

  private keys(): Set<string> {
    return new Set(Object.values(this.claims).flatMap((record) => Object.keys(record)));
  }

  /** @throws */
  assertIsSupported(supportedClaims: Set<string>): void {
    const unsupported = supportedClaims.difference(this.keys());
    if (unsupported.size) {
      const list = Array.from(unsupported);
      this.logger.warn(`unsupported claims: ${list.join(', ')}`);
      throw new UnsupportedOpenIdClaims(list);
    }
  }
}

export class UnsupportedOpenIdClaims extends Error {
  constructor(readonly claims: readonly string[]) {
    super();
  }
}
