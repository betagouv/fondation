import { vi } from "vitest";
import "@codegouvfr/react-dsfr/dsfr/dsfr.min.css";
import "@testing-library/jest-dom/vitest";

process.env.TZ = "Europe/Paris";

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// We need to start the DSFR with this import to await for its loading,
// not using 'startReactDsfr' function
const dsfr = await import("@codegouvfr/react-dsfr/start.js");
await dsfr.start({
  defaultColorScheme: "light",
  verbose: false,
  nextParams: undefined,
  doCheckNonce: false,
  trustedTypesPolicyName: "default",
});

global.IntersectionObserver = vi.fn((callback, options) => {
  return {
    root: options?.root,
    rootMargin: options?.rootMargin,
    thresholds: options?.thresholds,
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
    triggerIntersect(entries) {
      callback(entries, this);
    },
  };
});

Element.prototype.scrollIntoView = vi.fn();

// Mock for Tip Tap Editor
Object.defineProperty(HTMLElement.prototype, "getClientRects", {
  writable: true,
  value: vi.fn().mockImplementation(() => [
    {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    },
  ]),
});

global.CSS = {
  supports: () => false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
