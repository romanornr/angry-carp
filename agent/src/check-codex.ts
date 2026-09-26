/** Checks that the Codex CLI reuses the ChatGPT login and returns the expected synthetic assessment. */
import { deepStrictEqual } from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const model = 'gpt-6-sol';
const credentialStore = 'cli_auth_credentials_store="auto"';
const environment: NodeJS.ProcessEnv = {};

for (const key of ['HOME', 'PATH', 'CODEX_HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS', 'TMPDIR']) {
	if (process.env[key] !== undefined) environment[key] = process.env[key];
}

const expected = { classification: 'Medium', reportReady: false };
const schema = {
	type: 'object',
	properties: {
		classification: { type: 'string', enum: ['Low', 'Medium', 'High'] },
		reportReady: { type: 'boolean' },
	},
	required: ['classification', 'reportReady'],
	additionalProperties: false,
};

const prompt = `This is a synthetic Angry Carp integration check. Use only the facts below.
Do not use tools, read files, connect to services, or take any external action.

Policy: High requires concrete evidence of deception or a malicious request.
A concrete unresolved concern is Medium. Ordinary unfamiliar mail is Low.
An unfamiliar sender and an attachment alone do not justify an abuse report.

Synthetic facts: An unfamiliar sender asks the recipient to review an attached
document. The message claims the recipient requested it, but the recipient has
not confirmed this. There is no established deception or malicious request.
Whether the recipient expected the document is a concrete unresolved concern.

Classify this message and state whether the evidence supports preparing an
abuse report now. Return only the required JSON object.`;

async function checkCodex() {
	const { stdout, stderr } = await execute('codex', ['-c', credentialStore, 'login', 'status'], { env: environment, timeout: 10_000 });

	if (`${stdout}\n${stderr}`.trim() !== 'Logged in using ChatGPT') {
		throw new Error('A Codex ChatGPT login is required. Run codex login and choose ChatGPT.');
	}

	const directory = await mkdtemp(join(tmpdir(), 'angry-carp-codex-'));

	try {
		const schemaPath = join(directory, 'response-schema.json');
		const responsePath = join(directory, 'response.json');
		await writeFile(schemaPath, JSON.stringify(schema), { mode: 0o600 });
		const args = [
			'exec', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--strict-config',
			'--skip-git-repo-check', '--sandbox', 'read-only', '--model', model,
			'--cd', directory, '--output-schema', schemaPath, '--output-last-message', responsePath,
			'-c', 'model_provider="openai"', '-c', 'approval_policy="never"',
			'-c', credentialStore,
			'-c', 'web_search="disabled"', '-c', 'history.persistence="none"',
			'-c', 'project_doc_max_bytes=0', '-c', 'features.skip_host_skill_discovery=true',
		];

		for (const feature of [
			'shell_tool', 'apps', 'plugins', 'hooks', 'multi_agent', 'multi_agent_v2',
			'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use',
			'image_generation', 'view_image', 'memories', 'skill_search',
			'skill_mcp_dependency_install', 'code_mode', 'code_mode_host',
		]) args.push('--disable', feature);

		args.push(prompt);

		process.stderr.write(`Using the existing Codex ChatGPT login with ${model}. Synthetic input only.\n`);
		const pending = execute('codex', args, { env: environment, timeout: 120_000, maxBuffer: 1024 * 1024 });
		pending.child.stdin?.end();
		const result = await pending;
		const responseText = await readFile(responsePath, 'utf8').catch(() => {
			process.stderr.write(`${result.stderr}\n${result.stdout}\n`);
			throw new Error('Codex exited without producing the requested response file.');
		});
		const response: unknown = JSON.parse(responseText);
		deepStrictEqual(response, expected, 'The synthetic case must stay Medium and must not justify a report.');
		process.stdout.write(`${JSON.stringify(response, null, 2)}\nCodex login reuse check passed.\n`);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

try {
	await checkCodex();
} catch (error) {
	const message = error instanceof Error ? error.message : 'Unknown failure';
	process.stderr.write(`Codex check failed: ${message}\nNo alternate model or API billing fallback was attempted.\n`);
	process.exitCode = 1;
}
