// oxlint-disable typescript/unbound-method
import { type ArgumentsHost } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { mock } from 'vitest-mock-extended';

import { FileMissingFromStorage } from './missing-from-storage';
import { MissingFromStorageFilter } from './missing-from-storage.filter';

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
