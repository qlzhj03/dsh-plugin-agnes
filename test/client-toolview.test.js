import assert from 'node:assert/strict';
import test from 'node:test';

function createReactStub() {
  const React = {
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children: children.flat(Infinity) } };
    },
    useCallback(fn) { return fn; },
    useMemo(fn) { return fn(); },
    useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
  };
  return React;
}

function flattenText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(' ');
  if (typeof node.type === 'function') return flattenText(node.type(node.props));
  return flattenText(node.props?.children);
}

async function loadToolView() {
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(spec) { loaded = spec; },
    },
  };
  await import(`../client.js?toolview-test=${Date.now()}-${Math.random()}`);
  assert.ok(loaded, 'client bundle registered with the module loader');
  const client = loaded.factory((id) => {
    if (id === 'react') return createReactStub();
    throw new Error(`unexpected client dependency: ${id}`);
  });

  let registration;
  const dictionaries = {
    'tool.generating': '正在调用 Agnes…',
    'tool.image': 'Agnes 图片',
    'tool.video': 'Agnes 视频',
    'tool.text': 'Agnes 文本',
    'tool.failed': 'Agnes 调用失败',
    'tool.prompt': '提示词',
    'tool.model': '模型',
    'tool.saved': '已保存到 Agnes 历史',
  };
  const locale = {
    register() {},
    bind() { return (key) => dictionaries[key] || key; },
    subscribe() { return () => {}; },
    getSnapshot() { return { active: 'zh' }; },
  };
  const ctx = {
    effect(register) { register(); },
    locale,
    slots: {
      inject(_name, register) { register(); },
      register(options, component) {
        if (options.name === 'tool.call.toolview') registration = { options, component };
        return () => {};
      },
    },
  };

  client.apply(ctx);
  assert.equal(registration?.options?.key, 'agnes_studio');
  return registration.component;
}

const resultBlock = {
  kind: 'tool-result',
  callId: 'call-1',
  name: 'agnes_studio',
  isError: false,
  content: [{ type: 'text', text: 'Generated an image.' }],
  meta: {
    studio: 'agnes',
    action: 'image',
    record: {
      id: 'record-1',
      kind: 'image',
      status: 'completed',
      prompt: 'A bakery storefront',
      mediaUrl: '/api/agnes-studio/media/record-1.png',
      createdAt: '2026-11-08T09:00:00.000Z',
    },
  },
};

test('a settled tool call renders its result instead of the running state', async () => {
  const ToolView = await loadToolView();
  const tree = ToolView({
    phase: 'result',
    block: resultBlock,
    toolName: 'agnes_studio',
    __ctx: {},
  });
  const text = flattenText(tree);

  assert.doesNotMatch(text, /正在调用 Agnes/);
  assert.match(text, /Agnes 图片/);
  assert.match(text, /completed/);
  assert.match(text, /A bakery storefront/);
});

test('an in-flight tool call still renders the running state', async () => {
  const ToolView = await loadToolView();
  const tree = ToolView({
    phase: 'start',
    block: {
      phase: 'start',
      callId: 'call-1',
      name: 'agnes_studio',
      argsRaw: '{"action":"image"}',
    },
    toolName: 'agnes_studio',
    __ctx: {},
  });

  assert.match(flattenText(tree), /正在调用 Agnes/);
});
