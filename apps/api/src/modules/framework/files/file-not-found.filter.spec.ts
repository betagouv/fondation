// oxlint-disable typescript/unbound-method
import { NotFoundException, type ArgumentsHost } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { mock } from 'vitest-mock-extended';

import { FileNotFoundFilter } from './file-not-found.filter';

describe('FileNotFoundFilter', () => {
  it('answers a readable page to the tab opened on a missing attachment', () => {
    const response = mock<ExpressResponse>();
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);
    const host = mock<ArgumentsHost>();
    host.switchToHttp.mockReturnValue({
      getNext: vi.fn(),
      getRequest: vi.fn(),
      getResponse: () => response,
    } as never);

    new FileNotFoundFilter().catch(new NotFoundException(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.type).toHaveBeenCalledWith('html');
    const [page] = response.send.mock.calls[0]!;
    expect(page).toContain('<html lang="fr"');
    expect(page).toContain('<title>Pièce jointe introuvable</title>');
    expect(page).toContain('Cette pièce jointe est introuvable. Prévenez le support.');
  });
});
