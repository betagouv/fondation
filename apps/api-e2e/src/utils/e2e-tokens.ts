import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const env = parseEnv(readFileSync(new URL('../../../api/.env.e2e', import.meta.url), 'utf8'));

function read(name: string): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is missing from apps/api/.env.e2e`);

  return value;
}

export const registrationToken = read('E2E_API_TOKEN');
export const machineToken = read('INBOUND_ALLOWED_API_TOKENS').split(',')[0]!;
