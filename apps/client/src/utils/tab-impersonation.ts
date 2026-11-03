export const IMPERSONATION_HEADER = 'X-Impersonation-Id';

const FRAGMENT_KEY = 'impersonation';
const ID_KEY = 'fondation:impersonation';
const NAME_KEY = 'fondation:impersonation-name';

/** kept in the tab's own storage, the impersonation reaches a new tab through its address fragment, which no request carries */
class TabImpersonation {
  get id(): string | null {
    return TabImpersonation.read(ID_KEY);
  }

  get endedFor(): string | null {
    return this.id ? null : TabImpersonation.read(NAME_KEY);
  }

  adoptFromAddress(): void {
    const id = new URLSearchParams(window.location.hash.slice(1)).get(FRAGMENT_KEY);
    if (!id) return;

    TabImpersonation.write(ID_KEY, id);
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }

  remember(name: string): void {
    TabImpersonation.write(NAME_KEY, name);
  }

  end(): void {
    TabImpersonation.remove(ID_KEY);
  }

  forget(): void {
    TabImpersonation.remove(ID_KEY);
    TabImpersonation.remove(NAME_KEY);
  }

  carry(url: URL, id = this.id): URL {
    if (!id || url.hash) return url;

    const carried = new URL(url);
    carried.hash = new URLSearchParams({ [FRAGMENT_KEY]: id }).toString();
    return carried;
  }

  carryIntoNewTabs(): void {
    const onClick = (event: MouseEvent) => {
      if (!this.id) return;

      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;

      const isNewTab =
        link.target === '_blank' || event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey;
      const url = new URL(link.href);
      if (!isNewTab || url.origin !== window.location.origin) return;

      const href = link.href;
      link.href = this.carry(url).toString();
      // React owns the link: it gets its address back once the browser has read it
      setTimeout(() => (link.href = href));
    };

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('auxclick', onClick, { capture: true });
  }

  private static read(key: string): string | null {
    return TabImpersonation.storage()?.getItem(key) ?? null;
  }

  private static write(key: string, value: string): void {
    TabImpersonation.storage()?.setItem(key, value);
  }

  private static remove(key: string): void {
    TabImpersonation.storage()?.removeItem(key);
  }

  private static storage(): Storage | null {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

export const tabImpersonation = new TabImpersonation();
