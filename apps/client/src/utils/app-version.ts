import type { DataRouter, Location } from 'react-router';

export const APP_VERSION_HEADER = 'X-App-Version';

const RELOADED_FOR_MISSING_CHUNK_KEY = 'fondation:reloaded-for-missing-chunk';
const RELOADED_FOR_SERVED_VERSION_KEY = 'fondation:reloaded-for-served-version';

type Destination = Pick<Location, 'hash' | 'pathname' | 'search'>;

/** a release replaces the files of the previous one: a full page load is the only way back to a working app */
export class AppVersion {
  #reloading = false;
  #served: string | undefined;

  constructor(
    private readonly current: string | undefined,
    private readonly navigate: (url: string) => void,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
  ) {}

  /** the router has already pushed the destination into the history: assign would duplicate the entry */
  static fromEnv(env: Pick<ImportMetaEnv, 'VITE_TAGGED_VERSION'>): AppVersion {
    return new AppVersion(
      env.VITE_TAGGED_VERSION,
      (url) => window.location.replace(url),
      window.sessionStorage,
    );
  }

  get isOutdated(): boolean {
    return this.#served !== undefined;
  }

  observe(response: Response): void {
    const served = response.headers.get(APP_VERSION_HEADER);
    if (this.current && served && served !== this.current) this.#served = served;
  }

  /** the router keeps emitting states while the page unloads: the first full load wins */
  reload(destination: Destination): void {
    if (this.#reloading) return;
    this.#reloading = true;
    this.navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  }

  /** a file missing for good must not reload forever: one attempt per version, the error page takes over */
  reloadForMissingChunk(destination: Destination): boolean {
    return this.reloadOnceFor(RELOADED_FOR_MISSING_CHUNK_KEY, this.current ?? '', destination);
  }

  /**
   * the API tells a release minutes before the new client is served: one full load per version
   * told, or every page change would reload until the client catches up
   */
  reloadForServedVersion(destination: Destination): boolean {
    if (!this.#served) return false;
    return this.reloadOnceFor(RELOADED_FOR_SERVED_VERSION_KEY, this.#served, destination);
  }

  private reloadOnceFor(key: string, version: string, destination: Destination): boolean {
    if (this.storage.getItem(key) === version) return false;

    this.storage.setItem(key, version);
    this.reload(destination);
    return true;
  }
}

export const appVersion = AppVersion.fromEnv(import.meta.env);

/**
 * a known newer version waits for the next page change: a reload in place would lose what is
 * being typed. The change is caught once done, a navigation between pages already loaded and
 * without loader never goes through a loading state
 */
export function reloadOutdatedTab(router: DataRouter, version: AppVersion = appVersion): () => void {
  const onPreloadError = (event: VitePreloadErrorEvent) => {
    const destination = router.state.navigation.location ?? window.location;
    if (version.reloadForMissingChunk(destination)) event.preventDefault();
  };
  window.addEventListener('vite:preloadError', onPreloadError);

  let pathname = router.state.location.pathname;
  const unsubscribe = router.subscribe(({ location }) => {
    if (location.pathname === pathname) return;
    pathname = location.pathname;
    version.reloadForServedVersion(location);
  });

  return () => {
    window.removeEventListener('vite:preloadError', onPreloadError);
    unsubscribe();
  };
}
