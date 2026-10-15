import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_VERSION_HEADER, AppVersion } from './app-version';

function makeStorage() {
  const stored = new Map<string, string>();
  const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: stored.set.bind(stored) };
  return () => storage;
}

function makeRouter() {
  return createMemoryRouter(
    [
      { element: null, path: '/' },
      { element: null, path: '/sessions' },
      { element: null, path: '/transparences' },
    ],
    { initialEntries: ['/'] },
  );
}

let stopWatching = () => {};
afterEach(() => {
  stopWatching();
  vi.useRealTimers();
});

function watchedTab(current: string | undefined, storage = makeStorage()) {
  const navigate = vi.fn();
  const appVersion = new AppVersion(current, navigate, storage);
  const router = makeRouter();
  stopWatching = appVersion.watch(router);
  return { appVersion, navigate, router };
}

function servedBy(version: string | undefined) {
  return new Response(null, { headers: version ? { [APP_VERSION_HEADER]: version } : {} });
}

function failToPreload() {
  const event = new Event('vite:preloadError', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('AppVersion.watch, once the server serves a version', () => {
  it('turns the next page change into a full load on the requested page', async () => {
    const { appVersion, navigate, router } = watchedTab('v1.0.0');
    appVersion.observe(servedBy('v1.1.0'));

    await router.navigate('/sessions?tab=files#top');

    expect(navigate).toHaveBeenCalledWith('/sessions?tab=files#top');
    expect(appVersion.isReloading).toBe(true);
  });

  it('starts a single full load, whatever the router emits meanwhile', async () => {
    const { appVersion, navigate, router } = watchedTab('v1.0.0');
    appVersion.observe(servedBy('v1.1.0'));

    await router.navigate('/sessions');
    await router.navigate('/transparences');

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('lets a change of search params go through as a client navigation', async () => {
    const { appVersion, navigate, router } = watchedTab('v1.0.0');
    appVersion.observe(servedBy('v1.1.0'));

    await router.navigate('/?tab=files');

    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['the same version', 'v1.0.0', 'v1.0.0'],
    ['no version', 'v1.0.0', undefined],
    ['a version to a tab without one, as in development', undefined, 'v1.0.0'],
  ])('leaves the tab alone when the server serves %s', async (_, current, served) => {
    const { appVersion, navigate, router } = watchedTab(current);
    appVersion.observe(servedBy(served));

    await router.navigate('/sessions');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not reload again for the same version until the delay is over, as while the client is still being deployed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const storage = makeStorage();
    const first = watchedTab('v1.0.0', storage);
    first.appVersion.observe(servedBy('v1.1.0'));
    await first.router.navigate('/sessions');
    stopWatching();

    const { appVersion, navigate, router } = watchedTab('v1.0.0', storage);
    appVersion.observe(servedBy('v1.1.0'));
    await router.navigate('/sessions');
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    await router.navigate('/transparences');
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('reloads for the next version even after an earlier one was tried', async () => {
    const storage = makeStorage();
    const first = watchedTab('v1.0.0', storage);
    first.appVersion.observe(servedBy('v1.1.0'));
    await first.router.navigate('/sessions');
    stopWatching();

    const { appVersion, navigate, router } = watchedTab('v1.0.0', storage);
    appVersion.observe(servedBy('v1.2.0'));
    await router.navigate('/sessions');

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('does not reload without storage, which could not stop a loop', async () => {
    const { appVersion, navigate, router } = watchedTab('v1.0.0', () => {
      throw new DOMException('blocked', 'SecurityError');
    });
    appVersion.observe(servedBy('v1.1.0'));

    await router.navigate('/sessions');

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('AppVersion.watch, on a missing chunk', () => {
  it('reloads once and lets the error through the second time', () => {
    const { appVersion, navigate } = watchedTab('v1.0.0');

    expect(failToPreload().defaultPrevented).toBe(true);
    expect(failToPreload().defaultPrevented).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(appVersion.isReloading).toBe(true);
  });

  it('reloads again once the tab runs a newer version', () => {
    const storage = makeStorage();
    watchedTab('v1.0.0', storage);
    failToPreload();
    stopWatching();

    const { navigate } = watchedTab('v1.1.0', storage);
    expect(failToPreload().defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('stays available after a reload for a served version', async () => {
    const { appVersion, router } = watchedTab('v1.0.0');
    appVersion.observe(servedBy('v1.1.0'));
    await router.navigate('/sessions');

    expect(failToPreload().defaultPrevented).toBe(true);
  });

  it('lets the error through without storage', () => {
    const { navigate } = watchedTab('v1.0.0', () => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(failToPreload().defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
