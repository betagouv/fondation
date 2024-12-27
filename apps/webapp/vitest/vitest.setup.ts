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

// We need to start the DSFR with this import, not using 'startReactDsfr' function
import "@codegouvfr/react-dsfr/start.js";

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
