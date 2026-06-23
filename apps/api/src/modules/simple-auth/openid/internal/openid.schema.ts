import { z } from 'zod';

const JsonWebKeySchema = z.looseObject({
  kty: z.string(),
  kid: z.string().optional(),
  alg: z.string().optional(),
});

export const JwksSchema = z.object({ keys: z.array(JsonWebKeySchema) });

export type Jwk = z.infer<typeof JsonWebKeySchema>;
