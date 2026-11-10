import assert from 'node:assert/strict';
import test from 'node:test';
import { DshModelProviders, DEFAULT_PROVIDER_ID } from '../lib/dsh-models.js';

function provider(overrides = {}) {
  return {
    displayName: 'Agnes',
    apiKeyEnv: 'AGNES_API_KEY',
    api: 'openai-completions',
    baseURL: 'https://api.agnes-ai.cn/v1',
    models: [{ id: 'agnes-3.0-flash', name: 'Agnes 3.0 Flash' }],
    ...overrides,
  };
}

function fakeSettings(providers = {}, { revision = 3, writable = true } = {}) {
  const value = { providers };
  const calls = [];
  return {
    writable,
    calls,
    async describe() {
      return [{ ns: 'llm-pi-ai', value, revision, writable, secrets: undefined }];
    },
    async mutate(ns, ops, expectedRevision) {
      calls.push({ ns, ops, expectedRevision });
      for (const op of ops) {
        if (op.path[0] !== 'providers') continue;
        if (op.op === 'set') value.providers[op.path[1]] = op.value;
        if (op.op === 'unset') delete value.providers[op.path[1]];
      }
    },
  };
}

function fakeCredentials({ configured = true, key = 'sk-test', source = 'file' } = {}) {
  const resolved = [];
  return {
    resolved,
    async describe(ref) {
      return { configured, writable: true, source };
    },
    async resolve(ref) {
      resolved.push(ref);
      return configured ? { value: key, source } : undefined;
    },
  };
}

test('finds the Agnes provider and reports credential readiness', async () => {
  const settings = fakeSettings({ agnes: provider() });
  const credentials = fakeCredentials();
  const models = new DshModelProviders({ settings, credentials, env: {} });

  const view = await models.describeConnection(DEFAULT_PROVIDER_ID);
  assert.equal(view.available, true);
  assert.equal(view.reason, 'ready');
  assert.equal(view.configured, true);
  assert.equal(view.provider.id, 'agnes');
  assert.equal(view.provider.baseUrl, 'https://api.agnes-ai.cn/v1');
  assert.equal(view.provider.apiKeyEnv, 'AGNES_API_KEY');
  assert.deepEqual(view.provider.models, ['agnes-3.0-flash']);
  assert.equal(view.key.configured, true);
  assert.deepEqual(credentials.resolved, []);
});

test('reports a missing provider without inventing a connection', async () => {
  const settings = fakeSettings({ maimai: provider({ baseURL: 'https://ai.tangbot.xyz/v1', apiKeyEnv: 'MAIMAI_API_KEY' }) });
  const models = new DshModelProviders({ settings, credentials: fakeCredentials(), env: {} });

  const view = await models.describeConnection(DEFAULT_PROVIDER_ID);
  assert.equal(view.available, true);
  assert.equal(view.reason, 'provider-missing');
  assert.equal(view.configured, false);
  assert.equal(view.provider, null);
  assert.deepEqual(view.providers.map((item) => item.id), ['maimai']);
});

test('creates an Agnes provider with the shared DSH credential reference', async () => {
  const settings = fakeSettings({}, { revision: 11 });
  const models = new DshModelProviders({ settings, credentials: fakeCredentials(), env: {} });

  const created = await models.ensureProvider(DEFAULT_PROVIDER_ID);
  assert.equal(created.created, true);
  assert.equal(created.provider.id, 'agnes');
  assert.equal(settings.calls.length, 1);
  assert.equal(settings.calls[0].ns, 'llm-pi-ai');
  assert.equal(settings.calls[0].expectedRevision, 11);
  const op = settings.calls[0].ops[0];
  assert.equal(op.op, 'set');
  assert.deepEqual(op.path, ['providers', 'agnes']);
  assert.equal(op.value.baseURL, 'https://api.agnes-ai.cn/v1');
  assert.equal(op.value.apiKeyEnv, 'AGNES_API_KEY');
  assert.equal(op.value.api, 'openai-completions');
  assert.equal(op.value.displayName, 'Agnes');
  assert.deepEqual(op.value.models.map((model) => model.id), ['agnes-3.0-flash']);
  assert.equal(op.value.models[0].contextWindow, 512_000);
  assert.equal(op.value.models[0].maxTokens, 65_536);

  const again = await models.ensureProvider(DEFAULT_PROVIDER_ID);
  assert.equal(again.created, false);
  assert.equal(settings.calls.length, 1);
});

test('does not overwrite an existing provider with the preferred id', async () => {
  const settings = fakeSettings({
    agnes: provider({ baseURL: 'https://proxy.example/v1' }),
  });
  const models = new DshModelProviders({ settings, credentials: fakeCredentials(), env: {} });

  const existing = await models.ensureProvider(DEFAULT_PROVIDER_ID);
  assert.equal(existing.created, false);
  assert.equal(existing.provider.id, 'agnes');
  assert.equal(existing.provider.baseUrl, 'https://proxy.example/v1');
  assert.equal(settings.calls.length, 0);
});

test('resolves the API key and base URL from the selected provider', async () => {
  const settings = fakeSettings({ agnes: provider() });
  const credentials = fakeCredentials({ key: 'sk-from-dsh' });
  const models = new DshModelProviders({ settings, credentials, env: {} });

  assert.equal(await models.resolveApiKey('agnes'), 'sk-from-dsh');
  assert.equal(await models.readBaseUrl('agnes'), 'https://api.agnes-ai.cn/v1');
  assert.equal(await models.resolveApiKey('missing'), 'sk-from-dsh');
  assert.equal(await models.readBaseUrl('missing'), 'https://api.agnes-ai.cn/v1');
});

test('falls back to the provider apiKeyEnv when credential services are unavailable', async () => {
  const settings = fakeSettings({ agnes: provider() });
  const models = new DshModelProviders({
    settings,
    credentials: undefined,
    env: { AGNES_API_KEY: 'sk-from-env' },
  });

  assert.equal(await models.resolveApiKey('agnes'), 'sk-from-env');
  const view = await models.describeConnection('agnes');
  assert.equal(view.reason, 'ready');
  assert.equal(view.key.source, 'env');
});
