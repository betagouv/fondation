// The schema reads the environment when it loads: each case reloads it under its own environment
async function isAccepted(env: { NODE_ENV: string; PASSWORD_HASH_COST: string }): Promise<boolean> {
  vi.stubEnv('NODE_ENV', env.NODE_ENV);
  vi.stubEnv('PASSWORD_HASH_COST', env.PASSWORD_HASH_COST);
  vi.resetModules();
  const { ConfigSchema } = await import('./config.schema');

  return ConfigSchema.shape.passwordHashCost.safeParse(undefined).success;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('passwordHashCost', () => {
  it('refuses to weaken the hashes in production', async () => {
    expect(await isAccepted({ NODE_ENV: 'production', PASSWORD_HASH_COST: '9' })).toBe(false);
  });

  it('accepts the default cost in production', async () => {
    expect(await isAccepted({ NODE_ENV: 'production', PASSWORD_HASH_COST: '10' })).toBe(true);
  });

  it('lets the e2e lower the cost outside production', async () => {
    expect(await isAccepted({ NODE_ENV: 'test', PASSWORD_HASH_COST: '4' })).toBe(true);
  });
});
