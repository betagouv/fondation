import { LoginAttempt } from './login-attempt';

describe('LoginAttempt', () => {
  const attempt = (failures: { email: number; ip: number }) =>
    new LoginAttempt({ email: 'ada@example.com', id: 'attempt-1', ip: '203.0.113.7' }, failures);

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
      { limit: 10, throttle: 'email' },
      { limit: 100, throttle: 'ip' },
    ]);
  });

  it('should cross a threshold only once', () => {
    expect(attempt({ email: 8, ip: 8 }).crossedThresholds).toEqual([]);
    expect(attempt({ email: 10, ip: 10 }).crossedThresholds).toEqual([]);
  });
});
