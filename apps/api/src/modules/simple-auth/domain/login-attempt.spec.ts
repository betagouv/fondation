import { LoginAttempt } from './login-attempt';

describe('LoginAttempt', () => {
  const attempt = (
    failures: { email: number; ip: number; knownBrowser?: number },
    knownBrowser: string | null = null,
  ) =>
    new LoginAttempt(
      { email: 'Ada@Example.com', id: 'attempt-1', ip: '203.0.113.7', knownBrowser },
      { knownBrowser: 0, ...failures },
    );

  it('should let an address try a tenth time after nine failures', () => {
    expect(attempt({ email: 9, ip: 9 }).isSuspended).toBe(false);
  });

  it('should suspend an address beyond ten failures', () => {
    expect(attempt({ email: 10, ip: 10 }).isSuspended).toBe(true);
  });

  it('should suspend an IP beyond a hundred failures, whatever the address', () => {
    expect(attempt({ email: 0, ip: 99 }).isSuspended).toBe(false);
    expect(attempt({ email: 0, ip: 100 }).isSuspended).toBe(true);
  });

  it('should tell the thresholds that the failure of the tenth try of an address crosses', () => {
    expect(attempt({ email: 9, ip: 99 }).crossedThresholds).toEqual([
      { limit: 10, target: 'ada@example.com', throttle: 'email' },
      { limit: 100, target: '203.0.113.7', throttle: 'ip' },
    ]);
  });

  it('should cross a threshold only once', () => {
    expect(attempt({ email: 8, ip: 8 }).crossedThresholds).toEqual([]);
    expect(attempt({ email: 10, ip: 10 }).crossedThresholds).toEqual([]);
  });

  describe('from a known browser', () => {
    const known = (failures: { email: number; ip: number; knownBrowser: number }) =>
      attempt(failures, 'browser-1');

    it('should let it log in while its address is suspended', () => {
      expect(known({ email: 10, ip: 10, knownBrowser: 0 }).isSuspended).toBe(false);
    });

    it('should suspend it beyond ten failures of its own', () => {
      expect(known({ email: 0, ip: 10, knownBrowser: 9 }).isSuspended).toBe(false);
      expect(known({ email: 0, ip: 10, knownBrowser: 10 }).isSuspended).toBe(true);
    });

    it('should suspend it beyond a hundred failures of its IP', () => {
      expect(known({ email: 0, ip: 100, knownBrowser: 0 }).isSuspended).toBe(true);
    });

    it('should tell the threshold that its tenth failure crosses, not the one of its address', () => {
      expect(known({ email: 9, ip: 9, knownBrowser: 9 }).crossedThresholds).toEqual([
        { limit: 10, target: 'browser-1', throttle: 'knownBrowser' },
      ]);
    });

    it('should forget on success the failures of the browser only, not those of its address', () => {
      expect(known({ email: 9, ip: 9, knownBrowser: 3 }).forgottenOnSuccess).toEqual({
        target: 'browser-1',
        throttle: 'knownBrowser',
      });
    });
  });

  it('should forget on success the failures of the address only, not those of its known browsers', () => {
    expect(attempt({ email: 3, ip: 9 }).forgottenOnSuccess).toEqual({
      target: 'ada@example.com',
      throttle: 'email',
    });
  });
});
