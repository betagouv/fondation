import { defineConfig } from 'vitest/config';

// Gathers every suite for the editor: the CI still runs each package on its own
export default defineConfig({ test: { projects: ['apps/*', 'packages/*'] } });
