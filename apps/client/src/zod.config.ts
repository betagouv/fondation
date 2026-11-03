import { z } from 'zod';

// Zod probes `new Function` to compile its object schemas, which the CSP forbids and reports on every page load.
// It reads this setting when a schema is built, so this module is imported before any other.
z.config({ jitless: true });
