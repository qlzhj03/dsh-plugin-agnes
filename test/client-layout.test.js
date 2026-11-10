import assert from 'node:assert/strict';
import test from 'node:test';

function createReactStub() {
  return {
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children: children.flat(Infinity) } };
    },
    useCallback(fn) { return fn; },
    useMemo(fn) { return fn(); },
    useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
  };
}

async function loadClient() {
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(spec) { loaded = spec; },
    },
  };
  await import(`../client.js?layout-test=${Date.now()}-${Math.random()}`);
  assert.ok(loaded, 'client bundle registered with the module loader');
  const client = loaded.factory((id) => {
    if (id === 'react') return createReactStub();
    throw new Error(`unexpected client dependency: ${id}`);
  });

  const dictionaries = {};
  const registrations = [];
  const locale = {
    register(namespace, language, dictionary) {
      dictionaries[language] = { ...(dictionaries[language] || {}), ...dictionary };
    },
    bind() { return (key) => dictionaries.zh?.[key] || key; },
    subscribe() { return () => {}; },
    getSnapshot() { return { active: 'zh' }; },
  };
  const ctx = {
    effect(register) { register(); },
    locale,
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
    registrations,
    registration(name) {
      const found = registrations.find((item) => item.options.name === name);
      assert.ok(found, `expected a ${name} registration`);
      return found;
    },
  };
}

test('registers a left-sidebar Agnes works page', async () => {
  const { registration } = await loadClient();
  const sidebar = registration('sidebar.panellist');
  const main = registration('main');

  assert.equal(sidebar.options.id, 'agnes-studio');
  assert.equal(sidebar.options.label(), 'Agnes 作品');
  assert.equal(main.options.key, sidebar.options.id);
});

test('keeps an Agnes settings page for model configuration', async () => {
  const { registration } = await loadClient();
  const section = registration('settings.section');
  assert.equal(section.options.id, 'agnes-studio');
  assert.equal(section.options.label(), 'Agnes 创作台');
});
