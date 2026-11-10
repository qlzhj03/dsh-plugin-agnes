import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('waits for the settings and credentials services used by the plugin', async () => {
  const { inject } = await import('../index.js');

  assert.ok(inject.includes('settings'), 'settings must be available before apply() reads it');
  assert.ok(inject.includes('credentials'), 'credentials must be available before apply() reads it');
});

test('registers automatic chat guidance only in scopes that expose the Agnes tool', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-plugin-test-'));
  const previousProfileDir = process.env.DSH_PROFILE_DIR;
  process.env.DSH_PROFILE_DIR = root;
  try {
    const { apply, inject } = await import('../index.js');
    const sections = [];
    const tools = [];
    const ctx = {
      get(name) {
        return name === 'credentials' ? undefined : undefined;
      },
      effect(register) {
        register();
        return () => {};
      },
      tools: {
        get(name, scope) {
          return name === 'agnes_studio' && scope === 'normal-agent' ? { name } : undefined;
        },
        register(tool) {
          tools.push(tool);
          return () => {};
        },
      },
      webServer: {
        register() {
          return () => {};
        },
      },
      systemPrompt: {
        getSectionOrder(name) {
          assert.equal(name, 'TOOL_WORKFLOW');
          return 2600;
        },
        section(section) {
          sections.push(section);
          return () => {};
        },
      },
    };

    apply(ctx);

    assert.ok(inject.includes('systemPrompt'));
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, 'agnes_studio');
    assert.equal(sections.length, 1);

    const guidance = sections[0].text({ scope: 'normal-agent' });
    assert.match(guidance, /without (?:the user )?naming Agnes/i);
    assert.match(guidance, /action: "image"/);
    assert.match(guidance, /action: "video"/);
    assert.match(guidance, /Do not invent a missing subject/i);
    assert.match(guidance, /clarification/i);
    assert.match(guidance, /recommended preset/i);
    assert.match(guidance, /no separate (?:UI )?card/i);
    assert.match(guidance, /ask_user_question/i);
    assert.match(guidance, /native question UI/i);
    assert.match(guidance, /ordinary conversation/i);
    assert.match(tools[0].description, /clarification with suggested presets/i);
    assert.match(tools[0].parameters.prompt.description, /returns a clarification/i);
    assert.equal(sections[0].text({ scope: 'review-agent' }), '');

    const clarification = {
      action: 'clarification',
      kind: 'image',
      question: 'What should the image show, and where will it be used?',
      recommended: 'image-portrait',
      presets: [{
        id: 'image-portrait',
        label: 'Portrait poster or portrait',
        ratio: '3:4',
        imageSize: '2K',
        hint: 'People, posters, and book covers.',
      }],
    };
    const summary = tools[0].output.render({}, clarification).map((part) => part.text).join('\n');
    assert.match(summary, /Suggested presets/);
    assert.match(summary, /3:4 · 2K/);
    assert.match(summary, /Do not claim anything was generated/);
    assert.equal(tools[0].output.presentationMeta({}, clarification).action, 'clarification');
  } finally {
    if (previousProfileDir === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = previousProfileDir;
    await new Promise((resolve) => setTimeout(resolve, 25));
    await rm(root, { recursive: true, force: true });
  }
});

test('serves the provider model catalog through the models route', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-plugin-test-'));
  const previousProfileDir = process.env.DSH_PROFILE_DIR;
  const previousFetch = globalThis.fetch;
  process.env.DSH_PROFILE_DIR = root;
  let handler = null;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(String(url), 'http://mock.local/v1/models');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer test-key');
    return new Response(JSON.stringify({
      object: 'list',
      data: [
        { id: 'agnes-3.0-flash' },
        { id: 'agnes-image-2.5-flash' },
        { id: 'agnes-video-2.5' },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const { apply } = await import(`../index.js?models-route-test=${Date.now()}`);
    const settings = {
      writable: true,
      async describe() {
        return [{
          ns: 'llm-pi-ai',
          revision: 1,
          value: {
            providers: {
              agnes: {
                displayName: 'Agnes',
                apiKeyEnv: 'AGNES_API_KEY',
                api: 'openai-completions',
                baseURL: 'http://mock.local/v1',
                models: [{ id: 'agnes-3.0-flash' }],
              },
            },
          },
        }];
      },
      async mutate() {},
    };
    const credentials = {
      async describe() { return { configured: true, writable: true, source: 'stored' }; },
      async resolve() { return 'test-key'; },
    };
    const ctx = {
      get(name) {
        if (name === 'settings') return settings;
        if (name === 'credentials') return credentials;
        return undefined;
      },
      effect(register) { register(); return () => {}; },
      tools: { register() { return () => {}; }, get() { return undefined; } },
      systemPrompt: { getSectionOrder() { return 2600; }, section() { return () => {}; } },
      webServer: { register(options) { handler = options.handler; return () => {}; } },
    };

    apply(ctx);
    assert.equal(typeof handler, 'function');

    let status = 0;
    let body = '';
    await handler(
      { url: '/api/agnes-studio/models', method: 'GET' },
      { writeHead(code) { status = code; }, end(chunk) { body = String(chunk ?? ''); } },
    );
    const payload = JSON.parse(body);
    assert.equal(status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.baseUrl, 'http://mock.local/v1');
    assert.deepEqual(payload.models, [
      { id: 'agnes-3.0-flash' },
      { id: 'agnes-image-2.5-flash' },
      { id: 'agnes-video-2.5' },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousProfileDir === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = previousProfileDir;
    await new Promise((resolve) => setTimeout(resolve, 25));
    await rm(root, { recursive: true, force: true });
  }
});
