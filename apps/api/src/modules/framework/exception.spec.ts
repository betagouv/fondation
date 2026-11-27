import {
  Controller,
  Get,
  Global,
  INestApplication,
  Logger,
  Module,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  @Get('missing')
  failWithNotFound(): never {
    throw new NotFoundException();
  }

  @Get('wrapped')
  failWithCause(): never {
    throw new ServiceUnavailableException('PDF_RENDERER_UNAVAILABLE', { cause: new Error('ECONNREFUSED') });
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

  afterEach(() => vi.restoreAllMocks());

  it('should report a 500 to Sentry', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const response = await fetch(await app.getUrl());

    expect(response.status).toBe(500);
    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.anything(), 500);
  });

  it('should write the error of a 500 with its stack, which the event of the request leaves out', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    await fetch(await app.getUrl());

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom', stack: expect.any(String) }),
    );
  });

  it('should write the error of a 500 that wraps another, with its cause', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    await fetch(`${await app.getUrl()}/wrapped`);

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        cause: expect.objectContaining({ message: 'ECONNREFUSED' }),
        message: 'PDF_RENDERER_UNAVAILABLE',
      }),
    );
  });

  it('should write no line for a 4xx, which the event of the request describes', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn');
    const error = vi.spyOn(Logger.prototype, 'error');

    const response = await fetch(`${await app.getUrl()}/missing`);

    expect(response.status).toBe(404);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('should report once to Sentry a thrown value that is not an Error', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    sentry.captureException.mockClear();

    const response = await fetch(`${await app.getUrl()}/string`);

    expect(response.status).toBe(500);
    expect(sentry.captureException.mock.calls.map(([exception]) => exception)).toEqual(['timeout']);
  });
});
