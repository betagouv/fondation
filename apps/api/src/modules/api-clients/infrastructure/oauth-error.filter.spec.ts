import { Controller, Global, type INestApplication, Module, Post, UseFilters } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { RequestEvent } from '../../framework/request-event';
import { ApiClientUnauthenticated } from '../domain/api-client';

import { OAuthErrorFilter } from './oauth-error.filter';

@Controller()
@UseFilters(OAuthErrorFilter)
class TokenController {
  @Post('auth')
  authenticate(): never {
    throw new ApiClientUnauthenticated();
  }
}

@Global()
@Module({
  controllers: [TokenController],
  exports: [RequestEvent],
  imports: [ClsModule.forRoot({ global: true })],
  providers: [RequestEvent],
})
class TestModule {}

describe('OAuthErrorFilter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger: false });
    RequestEvent.mount(app);
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('should describe the refusal in the request event', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const response = await fetch(`${await app.getUrl()}/auth`, { method: 'POST' });
    const body: unknown = await response.json();
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    const event: unknown = JSON.parse(String(write.mock.calls[0]?.[0]));
    write.mockRestore();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'invalid_client' });
    expect(event).toMatchObject({ 'error.type': 'ApiClientUnauthenticated', level: 'warn' });
  });
});
