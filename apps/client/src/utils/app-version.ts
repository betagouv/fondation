import type { DataRouter, Location } from 'react-router';

export const APP_VERSION_HEADER = 'X-App-Version';

const RELOADED_FOR_MISSING_CHUNK_KEY = 'fondation:reloaded-for-missing-chunk';
const RELOADED_FOR_SERVED_VERSION_KEY = 'fondation:reloaded-for-served-version';
const SERVED_VERSION_RETRY_DELAY_MS = 60_000;

type Destination = Pick<Location, 'hash' | 'pathname' | 'search'>;

/** a release replaces the files of the previous one: a full page load is the only way back to a working app */
export class AppVersion {
  #reloading = false;
  #served: string | undefined;

  constructor(
    private readonly current: string | undefined,
    private readonly navigate: (url: string) => void,
    private readonly storage: () => Pick<Storage, 'getItem' | 'setItem'>,
  ) {}

  static fromEnv(env: Pick<ImportMetaEnv, 'VITE_TAGGED_VERSION'>): AppVersion {
    return new AppVersion(
      env.VITE_TAGGED_VERSION,
      /** @warning the router has already pushed the destination into the history: assign would duplicate the entry */
      (url) => window.location.replace(url),
      () => window.sessionStorage,
    );
  }

  get isReloading(): boolean {
    return this.#reloading;
  }

  observe(response: Response): void {
    const served = response.headers.get(APP_VERSION_HEADER);
    if (this.current && served && served !== this.current) this.#served = served;
  }

  /**
   * a known newer version waits for the next page change: a reload in place would lose what is
   * being typed. The change is caught once done, a navigation between pages already loaded and
   * without loader never goes through a loading state
   */
  watch(router: DataRouter): () => void {
    const onPreloadError = (event: VitePreloadErrorEvent) => {
      const destination = router.state.navigation.location ?? window.location;
      if (this.reloadForMissingChunk(destination)) event.preventDefault();
    };
    window.addEventListener('vite:preloadError', onPreloadError);

    let pathname = router.state.location.pathname;
    const unsubscribe = router.subscribe(({ location }) => {
      if (location.pathname === pathname) return;
      pathname = location.pathname;
      this.reloadForServedVersion(location);
    });

    return () => {
      window.removeEventListener('vite:preloadError', onPreloadError);
      unsubscribe();
    };
  }

  /** the router keeps emitting states while the page unloads: the first full load wins */
  private reload(destination: Destination): void {
    if (this.#reloading) return;
    this.#reloading = true;
    this.navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  }

  /** a file missing for good must not reload forever: one attempt per version, the error page takes over */
  private reloadForMissingChunk(destination: Destination): boolean {
    const version = this.current ?? '';
    if (this.read(RELOADED_FOR_MISSING_CHUNK_KEY) === version) return false;
    if (!this.remember(RELOADED_FOR_MISSING_CHUNK_KEY, version)) return false;

    this.reload(destination);
    return true;
  }

  /**
   * the API is deployed minutes before the client: a reload in between gets the previous client
   * back, so the same version is tried again once the delay is over rather than on every page change
   */
  private reloadForServedVersion(destination: Destination): void {
    if (!this.#served) return;

    const [version, triedAt] = this.read(RELOADED_FOR_SERVED_VERSION_KEY)?.split('@') ?? [];
    if (version === this.#served && Date.now() - Number(triedAt) < SERVED_VERSION_RETRY_DELAY_MS) return;
    if (!this.remember(RELOADED_FOR_SERVED_VERSION_KEY, `${this.#served}@${Date.now()}`)) return;

    this.reload(destination);
  }

  private read(key: string): string | null {
    try {
      return this.storage().getItem(key);
    } catch {
      return null;
    }
  }

  /** without storage, nothing tells a reload already tried: better none than an endless loop */
  private remember(key: string, value: string): boolean {
    try {
      this.storage().setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export const appVersion = AppVersion.fromEnv(import.meta.env);
