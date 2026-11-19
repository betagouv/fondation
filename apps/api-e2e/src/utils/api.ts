import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const coverageDir = fileURLToPath(new URL('../../../api/coverage/e2e/tmp/', import.meta.url));

function makeOnData(source: 'stdout' | 'stderr', resolve: (url: string) => void) {
  const decoder = new TextDecoder();
  const re = /running on\s*(http:\/\/[[\]a-zA-Z0-9/\-_:]+)/i;

  return function onData(chunk: Buffer) {
    const line = decoder.decode(chunk);
    const match = re.exec(line);

    // You can uncomment this line to debug the behavior of the server
    // if (source === 'stdout') process.stdout.write(line);
    if (source === 'stderr') process.stderr.write(line);

    if (match) resolve(match[1]!);
  };
}

/**
 * Builds and starts the api on a random port, its alerts sent to the collector
 *
 * @param env read before `.env.e2e`, which never overrides a variable already set
 */
export async function startApi(
  tchapUrl: string,
  env: Record<string, string> = {},
): Promise<[apiUrl: string, stop: () => Promise<void>]> {
  const server = spawn('pnpm', ['--filter', 'api', 'start:e2e'], {
    env: {
      ...process.env,
      APP_VERSION: 'e2e',
      PORT: '0',
      TCHAP_ACCESS_TOKEN: 'e2e',
      TCHAP_HOMESERVER_URL: tchapUrl,
      TCHAP_ROOM_ID: '!alerts:tchap.e2e',
      ...(process.env.COVERAGE ? { NODE_V8_COVERAGE: coverageDir } : {}),
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  const signalGroup = (signal: NodeJS.Signals) => {
    if (!server.pid) return;
    try {
      process.kill(-server.pid, signal); // whole group
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ESRCH') throw err;
      // group already gone — fall back to the direct child if it's still around
      try {
        server.kill(signal);
      } catch {
        /* already dead */
      }
    }
  };

  const kill = () => {
    server.removeAllListeners();
    signalGroup('SIGKILL');
  };

  const groupIsGone = () => {
    try {
      process.kill(-server.pid!, 0);
      return false;
    } catch (err) {
      return (err as NodeJS.ErrnoException).code === 'ESRCH';
    }
  };

  // SIGTERM lets the api write its coverage before leaving. The pnpm wrapper exits first,
  // so waiting on the direct child would SIGKILL the api mid-flush: wait for the whole group
  const stop = async () => {
    if (!server.pid) return;

    signalGroup('SIGTERM');
    const deadline = Date.now() + 10_000;
    while (!groupIsGone() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    kill();
  };

  const apiUrl = await new Promise<string>((resolve, reject) => {
    let alreadyResolved = false;
    const resolveAndRemoveTimeout = (value: string) => {
      alreadyResolved = true;
      resolve(value);
    };

    const signal = AbortSignal.timeout(process.env.CI ? 30_000 : 10_000);
    signal.addEventListener('abort', () => {
      if (alreadyResolved) return;

      kill();
      reject(new Error('API server did not start within 10s'));
    });

    server.stdout?.on('data', makeOnData('stdout', resolveAndRemoveTimeout));
    server.stderr?.on('data', makeOnData('stderr', resolveAndRemoveTimeout));

    server.on('error', reject);
    server.on('exit', (code) => {
      if (code !== 0) reject(new Error(`API server exited with code ${code}`));
    });
  });

  return [apiUrl, stop];
}
