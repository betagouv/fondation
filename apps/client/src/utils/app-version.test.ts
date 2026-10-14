import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_VERSION_HEADER, AppVersion, reloadOutdatedTab } from './app-version';

function makeStorage() {
  const stored = new Map<string, string>();
  return { getItem: (key: string) => stored.get(key) ?? null, setItem: stored.set.bind(stored) };
}

function makeAppVersion(current: string | undefined, storage = makeStorage()) {
  const navigate = vi.fn();
  return { appVersion: new AppVersion(current, navigate, storage), navigate };
}

function responseServedBy(version: string | undefined) {
  return new Response(null, { headers: version ? { [APP_VERSION_HEADER]: version } : {} });
}

const location = { hash: '#top', pathname: '/sessions/1', search: '?tab=files' };

describe('AppVersion.observe', () => {
  it('stays up to date while the server serves the same version', () => {
    const { appVersion } = makeAppVersion('v1.0.0');
    appVersion.observe(responseServedBy('v1.0.0'));
    expect(appVersion.isOutdated).toBe(false);
  });

  it('ignores a server that does not tell its version', () => {
    const { appVersion } = makeAppVersion('v1.0.0');
    appVersion.observe(responseServedBy(undefined));
    expect(appVersion.isOutdated).toBe(false);
  });

  it('ignores a tab without a version, as in development', () => {
    const { appVersion } = makeAppVersion(undefined);
    appVersion.observe(responseServedBy('v1.0.0'));
    expect(appVersion.isOutdated).toBe(false);
  });

  it('becomes outdated once the server serves another version', () => {
    const { appVersion } = makeAppVersion('v1.0.0');
    appVersion.observe(responseServedBy('v1.1.0'));
    expect(appVersion.isOutdated).toBe(true);
  });
});

describe('AppVersion.reload', () => {
  it('starts a single full load, whatever the router emits meanwhile', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    appVersion.reload(location);
    appVersion.reload({ ...location, pathname: '/elsewhere' });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/sessions/1?tab=files#top');
  });
});

describe('AppVersion.reloadForMissingChunk', () => {
  it('reloads on the requested page', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    expect(appVersion.reloadForMissingChunk(location)).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/sessions/1?tab=files#top');
  });

  it('does not reload twice the same version', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    appVersion.reloadForMissingChunk(location);
    expect(appVersion.reloadForMissingChunk(location)).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the tab runs a newer version', () => {
    const storage = makeStorage();
    makeAppVersion('v1.0.0', storage).appVersion.reloadForMissingChunk(location);

    const { appVersion, navigate } = makeAppVersion('v1.1.0', storage);
    expect(appVersion.reloadForMissingChunk(location)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

describe('AppVersion.reloadForServedVersion', () => {
  it('does nothing while the tab is up to date', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    expect(appVersion.reloadForServedVersion(location)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('reloads on the requested page once a newer version is served', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    appVersion.observe(responseServedBy('v1.1.0'));
    expect(appVersion.reloadForServedVersion(location)).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/sessions/1?tab=files#top');
  });

  it('does not reload again for a version already tried, as while the client is still being deployed', () => {
    const storage = makeStorage();
    const first = makeAppVersion('v1.0.0', storage).appVersion;
    first.observe(responseServedBy('v1.1.0'));
    first.reloadForServedVersion(location);

    const { appVersion, navigate } = makeAppVersion('v1.0.0', storage);
    appVersion.observe(responseServedBy('v1.1.0'));
    expect(appVersion.reloadForServedVersion(location)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('reloads for the next version even after an earlier one was tried', () => {
    const storage = makeStorage();
    const first = makeAppVersion('v1.0.0', storage).appVersion;
    first.observe(responseServedBy('v1.1.0'));
    first.reloadForServedVersion(location);

    const { appVersion, navigate } = makeAppVersion('v1.0.0', storage);
    appVersion.observe(responseServedBy('v1.2.0'));
    expect(appVersion.reloadForServedVersion(location)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('keeps the missing chunk reload available after a reload for a served version', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    appVersion.observe(responseServedBy('v1.1.0'));
    appVersion.reloadForServedVersion(location);
    expect(appVersion.reloadForMissingChunk(location)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

describe('reloadOutdatedTab', () => {
  function makeRouter() {
    return createMemoryRouter(
      [
        { element: null, path: '/' },
        { element: null, path: '/sessions' },
      ],
      { initialEntries: ['/'] },
    );
  }

  let stopWatching = () => {};
  afterEach(() => stopWatching());

  it('turns the next page change into a full load once a newer version is served', async () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    const router = makeRouter();
    stopWatching = reloadOutdatedTab(router, appVersion);
    appVersion.observe(responseServedBy('v1.1.0'));

    await router.navigate('/sessions?tab=files');

    expect(navigate).toHaveBeenCalledWith('/sessions?tab=files');
  });

  it('lets a change of search params go through as a client navigation', async () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    const router = makeRouter();
    stopWatching = reloadOutdatedTab(router, appVersion);
    appVersion.observe(responseServedBy('v1.1.0'));

    await router.navigate('/?tab=files');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves an up to date tab alone', async () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    const router = makeRouter();
    stopWatching = reloadOutdatedTab(router, appVersion);
    appVersion.observe(responseServedBy('v1.0.0'));

    await router.navigate('/sessions');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('reloads once on a missing chunk and lets the error through the second time', () => {
    const { appVersion, navigate } = makeAppVersion('v1.0.0');
    stopWatching = reloadOutdatedTab(makeRouter(), appVersion);

    const first = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(first);
    const second = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(second);

    expect(first.defaultPrevented).toBe(true);
    expect(second.defaultPrevented).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
