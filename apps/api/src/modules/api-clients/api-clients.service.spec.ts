// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { Clock } from '../framework/clock';
import { WideEvent } from '../framework/wide-event';

import { ApiClientsService } from './api-clients.service';
import {
  ApiClient,
  ApiClientForbidden,
  ApiClientUnauthenticated,
  REFUSALS_LIMIT_PER_MINUTE,
} from './domain/api-client';
import { ApiClientRateLimited } from './domain/rate-window';
import { ApiClientAlerts } from './infrastructure/api-client-alerts';
import { ApiClientRepository } from './infrastructure/api-client.repository';

describe('ApiClientsService', () => {
  const partnerIp = '203.0.113.7';
  const unknownIp = '198.51.100.1';
  const { hash: secretHash, secret } = ApiClient.generateSecret();
  const client = new ApiClient({
    allowedIps: [partnerIp],
    authLimitPerMinute: 10,
    id: 'client-1',
    previousSecret: null,
    revokedAt: null,
    scopes: [{ limitPerMinute: 20, scope: 'magistrats:identification' }],
    secretHash,
  });

  let alerts: MockProxy<ApiClientAlerts>;
  let repository: MockProxy<ApiClientRepository>;
  let wideEvent: MockProxy<WideEvent>;
  let service: ApiClientsService;

  beforeEach(() => {
    alerts = mock();
    repository = mock();
    repository.findAllowedIps.mockResolvedValue([partnerIp]);
    repository.findById.mockResolvedValue(client);
    repository.findByToken.mockResolvedValue({ client, tokenExpiresAt: new Date('2026-11-23T10:15:00Z') });
    repository.findCount.mockResolvedValue(0);
    repository.countCall.mockResolvedValue(1);
    repository.saveToken.mockResolvedValue(true);
    const clock = mock<Clock>();
    clock.now.mockReturnValue(new Date('2026-11-23T10:00:00Z'));
    wideEvent = mock();
    service = new ApiClientsService(alerts, clock, mock(), mock(), repository, wideEvent);
  });

  describe('the event of the request', () => {
    it('should name the client, even when it is refused', async () => {
      await expect(
        service.authorize({ ip: unknownIp, scope: 'magistrats:identification', token: 'token' }),
      ).rejects.toThrow(ApiClientForbidden);

      expect(wideEvent.set).toHaveBeenCalledWith({ 'api_client.id': 'client-1' });
    });

    it('should name the client a wrong secret is tried on', async () => {
      await expect(
        service.authenticate({ clientId: 'client-1', clientSecret: 'wrong', ip: partnerIp }),
      ).rejects.toThrow(ApiClientUnauthenticated);

      expect(wideEvent.set).toHaveBeenCalledWith({ 'api_client.id': 'client-1' });
    });

    it('should name nothing for an unknown token', async () => {
      repository.findByToken.mockResolvedValue(null);

      await expect(
        service.authorize({ ip: partnerIp, scope: 'magistrats:identification', token: 'unknown' }),
      ).rejects.toThrow(ApiClientUnauthenticated);

      expect(requestEvent.set).not.toHaveBeenCalled();
    });

    it('should name nothing for an unknown client_id', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.authenticate({ clientId: 'unknown', clientSecret: secret, ip: partnerIp }),
      ).rejects.toThrow(ApiClientUnauthenticated);

      expect(requestEvent.set).not.toHaveBeenCalled();
    });
  });

  describe('a client refused despite a right token or secret', () => {
    it('should report the IP it calls from when the client does not allow it', async () => {
      await expect(
        service.authorize({ ip: unknownIp, scope: 'magistrats:identification', token: 'token' }),
      ).rejects.toThrow(ApiClientForbidden);

      expect(alerts.forbidden).toHaveBeenCalledWith({
        clientId: 'client-1',
        ip: unknownIp,
        reason: 'ip',
        route: 'magistrats:identification',
      });
    });

    it('should report the route the client was not registered for', async () => {
      await expect(
        service.authorize({ ip: partnerIp, scope: 'magistrats:status', token: 'token' }),
      ).rejects.toThrow(ApiClientForbidden);

      expect(alerts.forbidden).toHaveBeenCalledWith({
        clientId: 'client-1',
        ip: partnerIp,
        reason: 'scope',
        route: 'magistrats:status',
      });
    });

    it('should not report the route again within the minute', async () => {
      repository.countCall.mockResolvedValue(2);

      await expect(
        service.authorize({ ip: partnerIp, scope: 'magistrats:status', token: 'token' }),
      ).rejects.toThrow(ApiClientForbidden);

      expect(repository.countCall).toHaveBeenCalledWith({
        caller: 'client:client-1',
        minute: new Date('2026-11-23T10:00:00Z'),
        route: 'forbidden:magistrats:status',
      });
      expect(alerts.forbidden).not.toHaveBeenCalled();
    });

    it('should report a right secret sent from an IP the client does not allow', async () => {
      await expect(
        service.authenticate({ clientId: 'client-1', clientSecret: secret, ip: unknownIp }),
      ).rejects.toThrow(ApiClientForbidden);

      expect(alerts.forbidden).toHaveBeenCalledWith({
        clientId: 'client-1',
        ip: unknownIp,
        reason: 'ip',
        route: 'auth',
      });
    });

    it('should not report a wrong secret on its own', async () => {
      await expect(
        service.authenticate({ clientId: 'client-1', clientSecret: 'wrong', ip: unknownIp }),
      ).rejects.toThrow(ApiClientUnauthenticated);

      expect(alerts.forbidden).not.toHaveBeenCalled();
      expect(alerts.refusalsLimited).not.toHaveBeenCalled();
    });
  });

  describe('a client over its limit', () => {
    const authorize = () =>
      service.authorize({ ip: partnerIp, scope: 'magistrats:identification', token: 'token' });

    it('should report the first call over the limit of the minute', async () => {
      repository.countCall.mockResolvedValue(21);

      await expect(authorize()).rejects.toThrow(ApiClientRateLimited);
      expect(alerts.rateLimited).toHaveBeenCalledWith({
        clientId: 'client-1',
        limit: 20,
        route: 'magistrats:identification',
      });
    });

    it('should not report the calls refused after it', async () => {
      repository.countCall.mockResolvedValue(22);

      await expect(authorize()).rejects.toThrow(ApiClientRateLimited);
      expect(alerts.rateLimited).not.toHaveBeenCalled();
    });
  });

  describe('an IP that piles up refusals', () => {
    const authenticate = () =>
      service.authenticate({ clientId: 'client-1', clientSecret: 'wrong', ip: unknownIp });

    it('should report the refusal that turns it away', async () => {
      repository.countCall.mockResolvedValue(REFUSALS_LIMIT_PER_MINUTE);

      await expect(authenticate()).rejects.toThrow(ApiClientUnauthenticated);
      expect(alerts.refusalsLimited).toHaveBeenCalledWith({
        ip: unknownIp,
        limit: REFUSALS_LIMIT_PER_MINUTE,
      });
    });

    it('should not report the refusals before it', async () => {
      repository.countCall.mockResolvedValue(REFUSALS_LIMIT_PER_MINUTE - 1);

      await expect(authenticate()).rejects.toThrow(ApiClientUnauthenticated);
      expect(alerts.refusalsLimited).not.toHaveBeenCalled();
    });
  });
});
