import { Controller, Get, type INestApplication, Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { ApiLogger } from './logger';
import { WideEvent } from './wide-event';

@Controller()
class LoggingController {
  private readonly logger = new Logger(LoggingController.name);

  @Get()
  get(): void {
    this.logger.log('serving');
  }
}

@Module({
  controllers: [LoggingController],
  imports: [ClsModule.forRoot({ global: true })],
  providers: [WideEvent],
})
class TestModule {}

describe('ApiLogger', () => {
  let app: INestApplication;

  afterEach(() => app.close());

  async function start(logger: ApiLogger): Promise<string> {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger });
    WideEvent.mount(app);
    await app.listen(0);
    return app.getUrl();
  }

  async function linesOf(send: () => Promise<unknown>): Promise<string[]> {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await send();
    // The event of the request is written last, once its answer is sent
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    const lines = write.mock.calls.map(([line]) => String(line));
    write.mockRestore();
    return lines;
  }

  it('should write a line in JSON with the id of the event of its request, its level and its time written alike', async () => {
    const url = await start(new ApiLogger({ json: true }));

    const [line, event] = (await linesOf(() => fetch(url))).map(
      (written) => JSON.parse(written) as Record<string, unknown>,
    );

    expect(line).toMatchObject({ context: 'LoggingController', level: 'info', message: 'serving' });
    expect(line!['request.id']).toEqual(event!['request.id']);
    expect(line!['timestamp']).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/));
    expect(event!['level']).toBe(line!['level']);
  });

  it('should write a line in JSON with the id of the event of its command', async () => {
    await start(new ApiLogger({ json: true }));

    const [line, event] = (
      await linesOf(() => app.get(WideEvent).runCommand(async () => new Logger('Command').log('running')))
    ).map((written) => JSON.parse(written) as Record<string, unknown>);

    expect(line).toMatchObject({ message: 'running' });
    expect(line!['request.id']).toEqual(expect.any(String));
    expect(line!['request.id']).toEqual(event!['request.id']);
  });

  it('should keep a readable text out of Scalingo', async () => {
    const url = await start(new ApiLogger({ colors: false, json: false }));

    const [line] = await linesOf(() => fetch(url));

    expect(line).toMatch(/LOG \[LoggingController\] serving\n$/);
  });
});
