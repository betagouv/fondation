import { spawn } from 'node:child_process';

import type { GlobalSetupContext } from 'vitest/node';

export async function setup({ provide }: GlobalSetupContext) {
  const server = spawn('pnpm', ['--filter', 'api', 'start:e2e'], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const apiUrl = await new Promise<string>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      const line = chunk.toString();
      const match = /running on:\s*(http:\/\/\S+)/i.exec(line);
      if (match) {
        resolve(match[1]!.replace('[::1]', 'localhost'));
      }
    };

    server.stdout?.on('data', onData);
    server.stderr?.on('data', onData);

    server.on('error', reject);
    server.on('exit', (code) => {
      if (code !== 0) reject(new Error(`API server exited with code ${code}`));
    });
  });

  provide('apiUrl', apiUrl);

  return () => {
    server.kill();
  };
}
