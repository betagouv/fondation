import * as time from '../../../utils/time';

import { KnownBrowser } from './known-browser';

describe('KnownBrowser', () => {
  const secret = 'a secret of at least thirty-two characters';
  const loggedInAt = new Date('2026-11-16T10:00:00Z');
  const issued = KnownBrowser.issue({ email: 'Ada@Example.com', now: loggedInAt });
  const cookie = issued.cookie(secret);
  const recognize = (given: string | undefined, login: { email?: string; now?: Date } = {}) =>
    KnownBrowser.recognize(given, { email: 'ada@example.COM', now: loggedInAt, ...login }, secret);

  it('should recognize the browser where a login to the address succeeded, whatever the case typed', () => {
    expect(recognize(cookie)?.id).toBe(issued.id);
  });

  it('should not recognize it for another address', () => {
    expect(recognize(cookie, { email: 'grace@example.com' })).toBeNull();
  });

  it('should not recognize a cookie whose date was moved forward', () => {
    const [id, , signature] = cookie.split('.');
    expect(recognize(`${id}.${Date.now()}.${signature}`)).toBeNull();
  });

  it('should not recognize a cookie signed with another secret', () => {
    expect(
      KnownBrowser.recognize(cookie, { email: 'ada@example.com', now: loggedInAt }, `${secret}!`),
    ).toBeNull();
  });

  it('should recognize it for a year after the login', () => {
    expect(recognize(cookie, { now: new Date(loggedInAt.getTime() + time.YEARS - 1) })).not.toBeNull();
    expect(recognize(cookie, { now: new Date(loggedInAt.getTime() + time.YEARS) })).toBeNull();
  });

  it('should not recognize a browser without cookie or with an unreadable one', () => {
    expect(recognize(undefined)).toBeNull();
    expect(recognize('not a cookie')).toBeNull();
  });
});
