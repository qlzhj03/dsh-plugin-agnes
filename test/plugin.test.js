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
    assert.match(guidance, /ordinary conversation/i);
    assert.equal(sections[0].text({ scope: 'review-agent' }), '');
  } finally {
    if (previousProfileDir === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = previousProfileDir;
    await new Promise((resolve) => setTimeout(resolve, 25));
    await rm(root, { recursive: true, force: true });
  }
});
