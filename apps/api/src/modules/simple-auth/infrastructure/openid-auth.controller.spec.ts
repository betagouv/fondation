import { Global, type INestApplication, Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { API_CONFIG_TOKEN } from '../../framework/config';
import { RequestEvent } from '../../framework/request-event';
import { SimpleAuthService } from '../simple-auth.service';

import { OpenIdAuthController } from './openid-auth.controller';
import { ListOpenIdProvidersQuery } from './queries/list-openid-providers.query';

@Global()
@Module({
  controllers: [OpenIdAuthController],
  exports: [RequestEvent],
  imports: [ClsModule.forRoot({ global: true })],
  providers: [
    RequestEvent,
    { provide: API_CONFIG_TOKEN, useValue: { frontendOriginUrl: 'https://fondation.test' } },
    { provide: ListOpenIdProvidersQuery, useValue: {} },
    {
      provide: SimpleAuthService,
      useValue: { openId: { login: () => Promise.reject(new Error('state mismatch')) } },
    },
  ],
})
class TestModule {}

describe('OpenIdAuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger: false });
    RequestEvent.mount(app);
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('should describe a failed login as a failure, although it answers with a redirection', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const response = await fetch(
      `${await app.getUrl()}/api/auth/v2/openid/pro-connect/callback?code=code&state=c3RhdGU`,
      { redirect: 'manual' },
    );
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    const event: unknown = JSON.parse(String(write.mock.calls[0]?.[0]));
    write.mockRestore();

    expect(response.headers.get('location')).toBe('https://fondation.test/login?error=true');
    expect(event).toMatchObject({ 'error.type': 'Error', 'http.response.status_code': 302, level: 'warn' });
  });
});
