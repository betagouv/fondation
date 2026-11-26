// oxlint-disable typescript/unbound-method
import {
  type ArgumentsHost,
  Controller,
  Get,
  Global,
  type INestApplication,
  Logger,
  Module,
  UseFilters,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Response as ExpressResponse } from 'express';
import { ClsModule } from 'nestjs-cls';
import { mock } from 'vitest-mock-extended';

import { WideEvent } from '../wide-event';

import { FileMissingFromStorage } from './missing-from-storage';
import { MissingFromStorageFilter } from './missing-from-storage.filter';

@Controller()
@UseFilters(MissingFromStorageFilter)
class FilesController {
  @Get('files/:fileUrlId')
  read(): never {
    throw new FileMissingFromStorage();
  }
}

@Global()
@Module({
  controllers: [FilesController],
  exports: [WideEvent],
  imports: [ClsModule.forRoot({ global: true })],
  providers: [WideEvent],
})
class TestModule {}

describe('MissingFromStorageFilter in an application', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger: false });
    WideEvent.mount(app);
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('should describe the missing file in the request event', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const response = await fetch(`${await app.getUrl()}/files/3b8e1f6a-2c4d-4a9e-8f1b-6d7c2e5a9f30`);
    await response.text();
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    const event: unknown = JSON.parse(String(write.mock.calls[0]?.[0]));
    write.mockRestore();

    expect(response.status).toBe(404);
    expect(event).toMatchObject({ 'error.type': 'FileMissingFromStorage', level: 'warn' });
  });
});

describe('MissingFromStorageFilter', () => {
  it('answers a readable page to the tab opened on a missing attachment', () => {
    const response = mock<ExpressResponse>();
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);
    const host = mock<ArgumentsHost>();
    host.switchToHttp.mockReturnValue({
      getNext: vi.fn(),
      getRequest: () => ({ path: '/api/files/v1/public-url-id' }),
      getResponse: () => response,
    } as never);

    new MissingFromStorageFilter().catch(new FileMissingFromStorage(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.type).toHaveBeenCalledWith('html');
    const [page] = response.send.mock.calls[0]!;
    expect(page).toContain('<html lang="fr"');
    expect(page).toContain('<title>Pièce jointe introuvable</title>');
    expect(page).toContain('Cette pièce jointe est introuvable. Prévenez le support.');
  });

  it('answers a page without any style, which the API CSP would block', () => {
    const response = mock<ExpressResponse>();
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);
    const host = mock<ArgumentsHost>();
    host.switchToHttp.mockReturnValue({
      getNext: vi.fn(),
      getRequest: () => ({ path: '/api/files/v1/public-url-id' }),
      getResponse: () => response,
    } as never);

    new MissingFromStorageFilter().catch(new FileMissingFromStorage(), host);

    const [page] = response.send.mock.calls[0]!;
    expect(page).not.toMatch(/<style|style=/);
  });
});
