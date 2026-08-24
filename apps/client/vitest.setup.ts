import '@testing-library/jest-dom/vitest';
import { setLink } from '@codegouvfr/react-dsfr/link';
import { cleanup } from '@testing-library/react';
import { Link } from 'react-router';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

// Mirrors main.tsx's Link registration so DSFR buttons render real hrefs in tests
// Cast needed: setLink's props union includes an href-only variant that react-router's Link rejects
setLink({ Link: Link as unknown as Parameters<typeof setLink>[0]['Link'] });

// jsdom implements <dialog> but none of its methods, so our own Modal cannot open in tests
Object.assign(HTMLDialogElement.prototype, {
  close(this: HTMLDialogElement) {
    if (!this.open) return;

    this.open = false;
    this.dispatchEvent(new Event('close'));
  },
  show(this: HTMLDialogElement) {
    this.open = true;
  },
  showModal(this: HTMLDialogElement) {
    this.open = true;
  },
});

expect.extend(axeMatchers);

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}

afterEach(() => {
  cleanup();
});
