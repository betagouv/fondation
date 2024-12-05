import { vi } from "vitest";
import "@codegouvfr/react-dsfr/dsfr/dsfr.min.css";
import "@testing-library/jest-dom/vitest";

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
