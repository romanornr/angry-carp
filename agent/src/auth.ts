/**
 * Connects the login command and Flue provider to the same local credential store.
 * Pi handles OAuth and credential storage at the path supplied by each caller.
 *
 * Failure handling:
 * - Replace credential-runtime exceptions with fixed messages naming the failed operation.
 * - Keep exception details out of command output because they may contain private information.
 *
 * See agent/README.md for store setup and location.
 */
import type { AuthInteraction } from '@earendil-works/pi-ai';
import { openaiCodexProvider } from '@earendil-works/pi-ai/providers/openai-codex';
import { ModelRuntime } from '@earendil-works/pi-coding-agent';

/**
 * openAuth opens the supplied credential store without starting login or a model request.
 * The returned login and logout methods update that store. The provider reads credentials
 * through the same runtime when it needs them. The process entry point must clean up any
 * provider sessions it starts after opening the store.
 */
export async function openAuth({ authPath }: { authPath: string }) {
  const runtime = await ModelRuntime.create({
    authPath,
    modelsPath: null,
    allowModelNetwork: false,
  }).catch(() => {
    throw new Error('Could not open the local credential store.');
  });

  const baseProvider = openaiCodexProvider();

  return {
    async login(interaction: AuthInteraction): Promise<void> {
      try {
        await runtime.login(baseProvider.id, 'oauth', interaction);
      } catch {
        throw new Error('ChatGPT sign-in did not complete.');
      }
    },

    async logout(): Promise<void> {
      try {
        await runtime.logout(baseProvider.id);
      } catch {
        throw new Error('Could not complete local sign-out.');
      }
    },

    provider: {
      ...baseProvider,
      auth: {
        apiKey: {
          name: 'ChatGPT subscription',

          async resolve() {
            try {
              const auth = await runtime.getAuth(baseProvider.id);

              if (!auth) {
                throw new Error('Missing authentication.');
              }

              return auth;
            } catch {
              throw new Error(
                'ChatGPT authentication is unavailable. Check the local login.',
              );
            }
          },
        },
      },
    },
  };
}
