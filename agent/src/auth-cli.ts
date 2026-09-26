/** Runs interactive ChatGPT login or local logout through the shared Pi credential store. */
import type { AuthInteraction } from '@earendil-works/pi-ai';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { openAuth } from './auth.ts';

const authPath = fileURLToPath(new URL('../auth.json', import.meta.url));

function browserInteraction(
  { signal }: { signal: AbortSignal },
): AuthInteraction {
  return {
    signal,

    async prompt(prompt) {
      signal.throwIfAborted();

      if (prompt.type === 'select') {
        return 'browser';
      }

      if (prompt.type !== 'manual_code') {
        throw new Error('Unsupported login prompt.');
      }

      const signals = [signal];

      if (prompt.signal) {
        signals.push(prompt.signal);
      }

      const cancellation = AbortSignal.any(signals);

      if (!cancellation.aborted) {
        await once(cancellation, 'abort');
      }

      throw new Error('Browser sign-in wait ended.');
    },

    notify(event) {
      if (event.type !== 'auth_url') {
        return;
      }

      process.stdout.write(`Open this link:\n${event.url}\n`);
      process.stdout.write('Waiting for sign-in. Ctrl+C cancels.\n');
    },
  };
}

async function main(): Promise<void> {
  const [command, ...extraArgs] = process.argv.slice(2);

  if (
    extraArgs.length > 0 ||
    (command !== 'login' && command !== 'logout')
  ) {
    process.stderr.write('Usage: node src/auth-cli.ts <login|logout>\n');
    process.exitCode = 2;
    return;
  }

  process.stdout.write(`Credential file: ${authPath}\n`);
  const auth = await openAuth({ authPath });

  if (command === 'logout') {
    await auth.logout();
    process.stdout.write('Local ChatGPT credentials removed.\n');
    return;
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timeout = setTimeout(cancel, 5 * 60_000);
  const interaction = browserInteraction({ signal: controller.signal });

  process.once('SIGINT', cancel);

  try {
    await auth.login(interaction);
  } finally {
    clearTimeout(timeout);
    process.removeListener('SIGINT', cancel);
  }

  process.stdout.write('ChatGPT sign-in completed.\n');
}

main().catch(() => {
  process.stderr.write(
    'Authentication command did not complete. ' +
    'Check the credential file location and try again.\n',
  );
  process.exitCode = 1;
});
