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

  @Get('string')
  failWithString(): never {
    // A library can throw a value that is not an Error
    // oxlint-disable-next-line typescript/only-throw-error
    throw 'timeout';
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

  it('should report once to Sentry a thrown value that is not an Error', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    sentry.captureException.mockClear();

    const response = await fetch(`${await app.getUrl()}/string`);

    expect(response.status).toBe(500);
    expect(sentry.captureException.mock.calls.map(([exception]) => exception)).toEqual(['timeout']);
  });
});
