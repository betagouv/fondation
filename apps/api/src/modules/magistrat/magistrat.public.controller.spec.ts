// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { WideEvent } from '../framework/wide-event';

import { MagistratPublicController } from './magistrat.public.controller';
import { MagistratService } from './magistrat.service';

describe('MagistratPublicController', () => {
  const magistratId = '0b3c5a3e-4f0e-4c4b-9d6e-2a1f7c8d9e10';

  let magistrats: MockProxy<MagistratService>;
  let wideEvent: MockProxy<WideEvent>;
  let controller: MagistratPublicController;

  beforeEach(() => {
    magistrats = mock();
    wideEvent = mock();
    controller = new MagistratPublicController(magistrats, wideEvent);
  });

  describe('the event of the request', () => {
    it('should name the magistrat identified, and the answer', async () => {
      magistrats.identifyMagistrat.mockResolvedValue({
        magistrat: { id: magistratId },
        status: 'ACTIVE',
      });

      await controller.identifyMagistrat({ email: 'jean.dupont@example.fr' });

      expect(wideEvent.set).toHaveBeenCalledWith({
        'fondation.magistrat.id': magistratId,
        'fondation.magistrat.status': 'ACTIVE',
      });
    });

    it('should tell that no magistrat was identified', async () => {
      magistrats.identifyMagistrat.mockResolvedValue({ status: 'UNKNOWN' });

      await controller.identifyMagistrat({ email: 'jean.dupont@example.fr' });

      expect(wideEvent.set).toHaveBeenCalledWith({
        'fondation.magistrat.id': undefined,
        'fondation.magistrat.status': 'UNKNOWN',
      });
    });

    it('should tell the status it answered', async () => {
      magistrats.findMagistratStatus.mockResolvedValue({ status: 'INACTIVE' });

      await controller.findMagistratStatus(magistratId);

      expect(wideEvent.set).toHaveBeenCalledWith({ 'fondation.magistrat.status': 'INACTIVE' });
    });
  });
});
