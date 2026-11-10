import assert from 'node:assert/strict';
import test from 'node:test';

function createHookRuntime() {
  const stores = new Map();
  const effects = [];
  let current = null;

  function storeFor(type) {
    let store = stores.get(type);
    if (!store) {
      store = { index: 0, states: [], refs: [] };
      stores.set(type, store);
    }
    return store;
  }

  function within(type, callback) {
    const previous = current;
    current = type;
    const store = storeFor(type);
    store.index = 0;
    try {
      return callback();
    } finally {
      current = previous;
    }
  }

  const React = {
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children: children.flat(Infinity) } };
    },
    useState(initial) {
      const store = storeFor(current);
      const index = store.index++;
      if (!(index in store.states)) store.states[index] = typeof initial === 'function' ? initial() : initial;
      return [store.states[index], (next) => {
        store.states[index] = typeof next === 'function' ? next(store.states[index]) : next;
      }];
    },
    useEffect(effect) {
      const store = storeFor(current);
      store.index += 1;
      effects.push(effect);
    },
    useRef(initial) {
      const store = storeFor(current);
      const index = store.index++;
      if (!(index in store.refs)) store.refs[index] = { current: initial };
      return store.refs[index];
    },
    useCallback(callback) {
      const store = storeFor(current);
      store.index += 1;
      return callback;
    },
    useMemo(factory) {
      const store = storeFor(current);
      store.index += 1;
      return factory();
    },
    useSyncExternalStore(_subscribe, getSnapshot) {
      const store = storeFor(current);
      store.index += 1;
      return getSnapshot();
    },
  };

  function expandNode(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return node;
    if (typeof node === 'string' || typeof node === 'number') return node;
    if (Array.isArray(node)) return node.map(expandNode);
    if (typeof node.type === 'function') {
      return expandNode(within(node.type, () => node.type(node.props)));
    }
    return { ...node, props: { ...node.props, children: expandNode(node.props?.children) } };
  }

  function renderNode(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(renderNode).join(' ');
    return renderNode(node.props?.children);
  }

  return {
    React,
    render(component, props = {}) {
      effects.length = 0;
      const tree = expandNode(within(component, () => component(props)));
      return {
        tree,
        text: renderNode(tree),
        effects: () => effects.slice(),
      };
    },
  };
}

function flattenNodes(node, predicate, found = []) {
  if (node === null || node === undefined || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    for (const child of node) flattenNodes(child, predicate, found);
    return found;
  }
  if (predicate(node)) found.push(node);
  flattenNodes(node.props?.children, predicate, found);
  return found;
}

async function loadClient() {
  const runtime = createHookRuntime();
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(spec) { loaded = spec; },
    },
  };
  await import(`../client.js?render-test=${Date.now()}-${Math.random()}`);
  assert.ok(loaded, 'client bundle registered with the module loader');
  const client = loaded.factory((id) => {
    if (id === 'react') return runtime.React;
    throw new Error(`unexpected client dependency: ${id}`);
  });

  const dictionaries = {};
  const registrations = [];
  const layout = { selected: null, selectPanel(panelId) { this.selected = panelId; } };
  const ctx = {
    effect(register) { register(); },
    get(name) { return name === 'layout' ? layout : undefined; },
    locale: {
      register(_namespace, language, dictionary) {
        dictionaries[language] = { ...(dictionaries[language] || {}), ...dictionary };
      },
      bind() { return (key) => dictionaries.zh?.[key] || key; },
      subscribe() { return () => {}; },
      getSnapshot() { return { active: 'zh' }; },
    },
    slots: {
      inject(_name, register) { register(); },
      register(options, component) {
        registrations.push({ options, component });
        return () => {};
      },
    },
  };
  client.apply(ctx);

  return {
    runtime,
    layout,
    registrations,
    registration(name) {
      const found = registrations.find((item) => item.options.name === name);
      assert.ok(found, `expected a ${name} registration`);
      return found;
    },
  };
}

const configFixture = {
  configured: true,
  config: {
    providerId: 'agnes',
    textModel: 'agnes-3.0-flash',
    imageModel: 'agnes-image-2.5-flash',
    videoModel: 'agnes-video-2.5-flash',
  },
  connection: {
    reason: 'ready',
    provider: {
      id: 'agnes',
      displayName: 'Agnes',
      apiKeyEnv: 'AGNES_API_KEY',
      baseUrl: 'https://api.agnes-ai.cn/v1',
    },
    providers: [{
      id: 'agnes',
      displayName: 'Agnes',
      apiKeyEnv: 'AGNES_API_KEY',
      baseUrl: 'https://api.agnes-ai.cn/v1',
      agnes: true,
    }],
  },
  setup: { canCreate: false, canEdit: true },
};

const modelsFixture = {
  ok: true,
  baseUrl: 'https://api.agnes-ai.cn/v1',
  models: [
    { id: 'agnes-2.5-flash' },
    { id: 'agnes-3.0-flash' },
    { id: 'agnes-image-2.1-flash' },
    { id: 'agnes-image-2.5-flash' },
    { id: 'agnes-video-2.5' },
    { id: 'agnes-video-2.5-flash' },
  ],
};

const historyFixture = {
  items: [{
    id: 'record-1',
    kind: 'image',
    status: 'completed',
    prompt: 'A bakery storefront',
    remoteUrl: 'https://example.test/bakery.png',
    mediaUrl: 'https://example.test/bakery.png',
    createdAt: '2026-11-08T09:00:00.000Z',
  }],
  total: 1,
  counts: { all: 1, text: 0, image: 1, video: 0 },
};

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('settings section renders model configuration without create or history tabs', async () => {
  const { runtime, registration } = await loadClient();
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.endsWith('/models')) {
      return { ok: true, status: 200, json: async () => modelsFixture };
    }
    assert.match(target, /\/api\/agnes-studio\/config$/);
    return { ok: true, status: 200, json: async () => configFixture };
  };

  const section = registration('settings.section');
  let rendered = runtime.render(section.component, {});
  for (const effect of rendered.effects()) effect();
  await flush();
  rendered = runtime.render(section.component, {});
  for (const effect of rendered.effects()) effect();
  await flush();
  rendered = runtime.render(section.component, {});

  const tabNodes = flattenNodes(rendered.tree, (node) => node.props?.role === 'tab');
  assert.equal(tabNodes.length, 0);
  assert.match(rendered.text, /文本模型/);
  assert.match(rendered.text, /图片模型/);
  assert.match(rendered.text, /视频模型/);
  assert.doesNotMatch(rendered.text, /历史存储位置/);
  assert.doesNotMatch(rendered.text, /Agnes API 文档/);

  const selects = flattenNodes(rendered.tree, (node) => node.type === 'select');
  assert.equal(selects.length, 3, 'only the three model fields use dropdowns');
  assert.deepEqual(selects.map((node) => node.props.value), [
    'agnes-3.0-flash',
    'agnes-image-2.5-flash',
    'agnes-video-2.5-flash',
  ]);
  const optionIds = selects.map((node) => flattenNodes(node, (child) => child.type === 'option').map((option) => option.props.value));
  assert.deepEqual(optionIds[0], ['agnes-2.5-flash', 'agnes-3.0-flash']);
  assert.deepEqual(optionIds[1], ['agnes-image-2.1-flash', 'agnes-image-2.5-flash']);
  assert.deepEqual(optionIds[2], ['agnes-video-2.5', 'agnes-video-2.5-flash']);
  assert.equal(
    flattenNodes(rendered.tree, (node) => node.type === 'a' && node.props?.href === 'https://platform.agnes-ai.cn/settings/apiKeys').length,
    0,
    'a configured provider needs no API key hint',
  );
});

test('settings section shows where to get an API key while unconfigured', async () => {
  const { runtime, registration } = await loadClient();
  const unconfiguredFixture = {
    configured: false,
    config: {
      providerId: 'agnes',
      textModel: 'agnes-3.0-flash',
      imageModel: 'agnes-image-2.5-flash',
      videoModel: 'agnes-video-2.5-flash',
    },
    connection: {
      reason: 'key-missing',
      provider: {
        id: 'agnes',
        displayName: 'Agnes',
        apiKeyEnv: 'AGNES_API_KEY',
        baseUrl: 'https://api.agnes-ai.cn/v1',
      },
      providers: [],
    },
    setup: { canCreate: false },
    apiKeysUrl: 'https://platform.agnes-ai.cn/settings/apiKeys',
  };
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/api\/agnes-studio\/config$/);
    return { ok: true, status: 200, json: async () => unconfiguredFixture };
  };

  const section = registration('settings.section');
  let rendered = runtime.render(section.component, {});
  for (const effect of rendered.effects()) effect();
  await flush();
  rendered = runtime.render(section.component, {});

  const links = flattenNodes(rendered.tree, (node) => node.type === 'a' && node.props?.href === 'https://platform.agnes-ai.cn/settings/apiKeys');
  assert.equal(links.length, 1, 'the missing-key state links to the Agnes API keys page');
  assert.equal(links[0].props.target, '_blank');
  assert.match(rendered.text, /还没有 API Key/);
  assert.match(rendered.text, /前往获取 API Key/);
});

test('sidebar gallery page lists saved works and can return to chat', async () => {
  const { runtime, layout, registration } = await loadClient();
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/api\/agnes-studio\/history/);
    return { ok: true, status: 200, json: async () => historyFixture };
  };

  const main = registration('main');
  let rendered = runtime.render(main.component, {});
  for (const effect of rendered.effects()) effect();
  await flush();
  rendered = runtime.render(main.component, {});

  assert.match(rendered.text, /Agnes 创作台/);
  assert.match(rendered.text, /A bakery storefront/);
  const back = flattenNodes(rendered.tree, (node) => node.props?.onClick && node.props?.children?.[0] === '返回对话');
  assert.equal(back.length, 1);
  back[0].props.onClick();
  assert.equal(layout.selected, null);
});
