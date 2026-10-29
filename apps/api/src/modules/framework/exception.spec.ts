import { Controller, Get, Global, INestApplication, Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ExceptionModule } from './exception';
import { SentryService } from './observability';

const sentry = { captureException: vi.fn() };

@Controller()
class FailingController {
  @Get()
  fail(): never {
    throw new Error('boom');
  }
}

@Global()
@Module({ exports: [SentryService], providers: [{ provide: SentryService, useValue: sentry }] })
class FakeObservabilityModule {}

describe('CatchEverythingFilter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FailingController],
      imports: [ExceptionModule, FakeObservabilityModule],
    }).compile();
    app = module.createNestApplication({ logger: false });
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('should report a 500 to Sentry', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const response = await fetch(await app.getUrl());

    expect(response.status).toBe(500);
    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.anything(), 500);
  });
});
