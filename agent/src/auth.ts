import type { AuthInteraction } from '@earendil-works/pi-ai';
import { openaiCodexProvider } from '@earendil-works/pi-ai/providers/openai-codex';
import { ModelRuntime } from '@earendil-works/pi-coding-agent';

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
