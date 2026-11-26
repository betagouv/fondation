// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { RequestEvent } from '../framework/request-event';

import { FindMagistratStatusQuery } from './infrastructure/queries/find-magistrat-status.query';
import { IdentifyMagistratQuery } from './infrastructure/queries/identify-magistrat.query';
import { MagistratPublicController } from './magistrat.public.controller';

describe('MagistratPublicController', () => {
  const magistratId = '0b3c5a3e-4f0e-4c4b-9d6e-2a1f7c8d9e10';

  let findMagistratStatusQuery: MockProxy<FindMagistratStatusQuery>;
  let identifyMagistratQuery: MockProxy<IdentifyMagistratQuery>;
  let requestEvent: MockProxy<RequestEvent>;
  let controller: MagistratPublicController;

  beforeEach(() => {
    findMagistratStatusQuery = mock();
    identifyMagistratQuery = mock();
    requestEvent = mock();
    controller = new MagistratPublicController(
      findMagistratStatusQuery,
      identifyMagistratQuery,
      requestEvent,
    );
  });

  describe('the event of the request', () => {
    it('should name the magistrat identified, and the answer', async () => {
      identifyMagistratQuery.handle.mockResolvedValue({ magistrat: { id: magistratId }, status: 'ACTIVE' });

      await controller.identifyMagistrat({ email: 'jean.dupont@example.fr' });

      expect(requestEvent.set).toHaveBeenCalledWith({
        'fondation.magistrat.id': magistratId,
        'fondation.magistrat.status': 'ACTIVE',
      });
    });

    it('should tell that no magistrat was identified', async () => {
      identifyMagistratQuery.handle.mockResolvedValue({ status: 'UNKNOWN' });

      await controller.identifyMagistrat({ email: 'jean.dupont@example.fr' });

      expect(requestEvent.set).toHaveBeenCalledWith({
        'fondation.magistrat.id': undefined,
        'fondation.magistrat.status': 'UNKNOWN',
      });
    });

    it('should tell the status it answered', async () => {
      findMagistratStatusQuery.handle.mockResolvedValue({ status: 'INACTIVE' });

      await controller.findMagistratStatus(magistratId);

      expect(requestEvent.set).toHaveBeenCalledWith({ 'fondation.magistrat.status': 'INACTIVE' });
    });
  });
});
