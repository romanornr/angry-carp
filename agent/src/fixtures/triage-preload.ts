import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { registerSessionResourceCleanup } from '@earendil-works/pi-ai';
import { openaiCodexProvider } from '@earendil-works/pi-ai/providers/openai-codex';

const authUrl = new URL('../auth.ts', import.meta.url).href;
const dbUrl = new URL('../db.ts', import.meta.url).href;

// Run the real CLI, agent and provider with synthetic auth and an in-memory database.
registerHooks({
  load(url, context, nextLoad) {
    if (process.env.ANGRY_CARP_TEST_FAILURE === 'clean' && (url === authUrl || url === dbUrl)) {
      throw new Error('A no-concerns run must not load credentials or conversation storage.');
    }
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
let modelCalls = 0;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  const host = url.hostname;
  if (process.env.ANGRY_CARP_TEST_FAILURE === 'clean') {
    if (host === 'cloudflare-dns.com') {
      const types: Record<string, number> = { MX: 15, TXT: 16 };
      return Response.json({ Status: 0, TC: false,
        Question: [{ name: url.searchParams.get('name'), type: types[url.searchParams.get('type') ?? ''] }], Answer: [] });
    }
    if (host === 'data.iana.org') return Response.json({ services: [[['com'], ['https://registry.example/']]] });
    if (host === 'registry.example') return Response.json({ objectClassName: 'domain', ldhName: 'example.com' });
  }
  if (host === 'cloudflare-dns.com' || host === 'data.iana.org') return new Response(null, { status: 503 });
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

  send(data: string) {
    modelCalls++;
    if (process.env.ANGRY_CARP_TEST_FAILURE === 'projection') {
      assert.match(data, /action\.example\.com/);
      assert.match(data, /image\.example\.org/);
      assert.match(data, /image_action_domain_difference/);
      assert.doesNotMatch(data, /private-(user|path|query|text|image|alt|filename)/);
    }
    queueMicrotask(() => {
      const item = { id: 'offline-message', type: 'message', role: 'assistant',
        content: [{ type: 'output_text', text: 'Invented unrelated sender identity.', annotations: [] }] };
      const events: unknown[] = [
        { type: 'response.output_item.added', output_index: 0, item: { ...item, content: [] } },
        { type: 'response.output_text.delta', output_index: 0, delta: 'Invented unrelated sender identity.' },
        { type: 'response.output_item.done', output_index: 0, item },
      ];
      const output: unknown[] = [item];
      if (process.env.ANGRY_CARP_TEST_FAILURE !== 'unstructured') {
        let id = 'reviewed_text';
        if (process.env.ANGRY_CARP_TEST_FAILURE === 'unknown-reference') id = 'invented';
        const args = JSON.stringify({ concern: 'high', confidence: 'moderate', hypothesis: 'impersonation',
          evidence: [{ id, role: 'supports' }] });
        const call = { id: 'fc_assessment', call_id: 'call_assessment', type: 'function_call',
          name: 'submit_assessment', arguments: args };
        events.push({ type: 'response.output_item.added', output_index: 1, item: { ...call, arguments: '' } },
          { type: 'response.function_call_arguments.delta', output_index: 1, delta: args },
          { type: 'response.output_item.done', output_index: 1, item: call });
        output.push(call);
      }
      events.push({ type: 'response.completed', response: { id: 'offline-response', status: 'completed', output } });
      for (const event of events) {
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
  const write = process.stdout.write.bind(process.stdout);
  Object.defineProperty(process.stdout, 'write', { value(chunk: string) {
    if (chunk.startsWith('\nAI assessment')) throw new Error('Synthetic output failure.');
    return write(chunk);
  } });
}
if (process.env.ANGRY_CARP_TEST_FAILURE === 'cleanup') {
  registerSessionResourceCleanup(() => { throw new Error('Private cleanup detail.'); });
}
process.on('exit', () => {
  let expected = 1;
  if (process.env.ANGRY_CARP_TEST_FAILURE === 'clean') expected = 0;
  assert.equal(opened, expected);
  assert.equal(closed, expected);
  assert.equal(modelCalls, expected, 'a completed structured assessment must not request another model turn');
  assert.equal(networkAttempts, 0);
});
