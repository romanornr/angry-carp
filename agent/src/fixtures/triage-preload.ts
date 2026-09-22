import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { registerSessionResourceCleanup } from '@earendil-works/pi-ai';
import { openaiCodexProvider } from '@earendil-works/pi-ai/providers/openai-codex';

const authUrl = new URL('../auth.ts', import.meta.url).href;
const dbUrl = new URL('../db.ts', import.meta.url).href;

// Run the real CLI, agent and provider with synthetic auth and an in-memory database.
registerHooks({
  load(url, context, nextLoad) {
    if (url === authUrl) {
      return { format: 'module', shortCircuit: true,
        source: `export { openAuth } from ${JSON.stringify(import.meta.url)};` };
    }
    if (url === dbUrl) {
      return { format: 'module', shortCircuit: true,
        source: "import { sqlite } from '@flue/runtime/node'; export default sqlite();" };
    }
    return nextLoad(url, context);
  },
});

export async function openAuth() {
  const fakeCredential = 'x.' + Buffer.from(JSON.stringify({
    'https://api.openai.com/auth': { chatgpt_account_id: 'offline-probe' },
  })).toString('base64') + '.x';
  return { provider: {
    ...openaiCodexProvider(),
    auth: { apiKey: { name: 'Offline test', async resolve() {
      return { auth: { apiKey: fakeCredential, baseUrl: 'https://invalid.invalid' } };
    } } },
  } };
}

let opened = 0;
let closed = 0;
let networkAttempts = 0;
globalThis.fetch = async () => {
  networkAttempts++;
  throw new Error('Network disabled in offline lifecycle test.');
};

class FakeWebSocket extends EventTarget {
  readyState = 0;

  constructor(url: string | URL) {
    super();
    assert.equal(new URL(url).hostname, 'invalid.invalid');
    opened++;
    queueMicrotask(() => {
      this.readyState = 1;
      this.dispatchEvent(new Event('open'));
    });
  }

  send() {
    queueMicrotask(() => {
      const item = { id: 'offline-message', type: 'message', role: 'assistant',
        content: [{ type: 'output_text', text: 'Offline assessment.', annotations: [] }] };
      for (const event of [
        { type: 'response.output_item.added', output_index: 0, item: { ...item, content: [] } },
        { type: 'response.output_text.delta', output_index: 0, delta: 'Offline assessment.' },
        { type: 'response.output_item.done', output_index: 0, item },
        { type: 'response.completed', response: { id: 'offline-response', status: 'completed', output: [item] } },
      ]) {
        this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(event) }));
      }
    });
  }

  close() {
    closed++;
    this.readyState = 3;
    this.dispatchEvent(new Event('close'));
  }
}

Object.defineProperty(globalThis, 'WebSocket', { value: FakeWebSocket });
if (process.env.ANGRY_CARP_TEST_FAILURE === 'output') {
  Object.defineProperty(process.stdout, 'write', { value() { throw new Error('Synthetic output failure.'); } });
}
if (process.env.ANGRY_CARP_TEST_FAILURE === 'cleanup') {
  registerSessionResourceCleanup(() => { throw new Error('Private cleanup detail.'); });
}
process.on('exit', () => {
  assert.equal(opened, 1);
  assert.equal(closed, 1);
  assert.equal(networkAttempts, 0);
});
