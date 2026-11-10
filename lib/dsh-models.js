export const LLM_PI_AI_NAMESPACE = 'llm-pi-ai';
export const DEFAULT_PROVIDER_ID = 'agnes';
export const DEFAULT_BASE_URL = 'https://api.agnes-ai.cn/v1';
export const DEFAULT_API_KEY_ENV = 'AGNES_API_KEY';

export const DEFAULT_PROVIDER_PROFILE = Object.freeze({
  displayName: 'Agnes',
  apiKeyEnv: DEFAULT_API_KEY_ENV,
  api: 'openai-completions',
  baseURL: DEFAULT_BASE_URL,
  models: [
    {
      id: 'agnes-2.5-flash',
      name: 'Agnes 2.5 Flash',
      input: ['text'],
    },
  ],
});

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return text.length > max ? text.slice(0, max) : text;
}

function normalizeBaseUrl(value) {
  return cleanString(value, 500).replace(/\/+$/, '');
}

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

function modelIds(profile) {
  if (!Array.isArray(profile?.models)) return [];
  return profile.models
    .map((model) => (typeof model === 'string' ? model : model?.id))
    .map((id) => cleanString(id, 200))
    .filter(Boolean);
}

function isAgnesProvider(profile) {
  const baseUrl = normalizeBaseUrl(profile?.baseURL).toLowerCase();
  if (baseUrl === DEFAULT_BASE_URL.toLowerCase()) return true;
  try {
    return new URL(baseUrl).hostname.toLowerCase() === new URL(DEFAULT_BASE_URL).hostname.toLowerCase();
  } catch {
    return false;
  }
}

function providerView(id, profile) {
  return {
    id,
    displayName: cleanString(profile?.displayName, 100) || id,
    baseUrl: normalizeBaseUrl(profile?.baseURL),
    api: cleanString(profile?.api, 100) || 'openai-completions',
    apiKeyEnv: cleanString(profile?.apiKeyEnv, 100),
    models: modelIds(profile),
    agnes: isAgnesProvider(profile),
  };
}

function pickProvider(providers, preferredId) {
  const entries = Object.entries(providers).filter(([, profile]) => profile && typeof profile === 'object');
  const preferred = entries.find(([id]) => id === preferredId);
  if (preferred) return { id: preferred[0], profile: preferred[1] };
  const agnes = entries.find(([, profile]) => isAgnesProvider(profile));
  if (agnes) return { id: agnes[0], profile: agnes[1] };
  return null;
}

function uniqueProviderId(providers, preferredId) {
  const base = cleanString(preferredId, 80) || DEFAULT_PROVIDER_ID;
  if (!Object.hasOwn(providers, base)) return base;
  const suffix = `${base}-studio`;
  if (!Object.hasOwn(providers, suffix)) return suffix;
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${suffix}-${index}`;
    if (!Object.hasOwn(providers, candidate)) return candidate;
  }
  throw new Error('Unable to choose an unused Agnes provider id');
}

/**
 * Bridge between the plugin and DSH's official llm-pi-ai model settings.
 * The provider owns the Base URL and the credential reference; the plugin
 * never stores or returns the API key.
 */
export class DshModelProviders {
  constructor({ settings, credentials, env = process.env } = {}) {
    this.settings = settings;
    this.credentials = credentials;
    this.env = env ?? {};
  }

  async descriptor() {
    if (this.settings === undefined || typeof this.settings.describe !== 'function') {
      return { available: false, reason: 'settings-unavailable', descriptor: null };
    }
    try {
      const descriptors = await this.settings.describe();
      const descriptor = Array.isArray(descriptors)
        ? descriptors.find((item) => item?.ns === LLM_PI_AI_NAMESPACE)
        : null;
      if (descriptor === null || descriptor === undefined) {
        return { available: false, reason: 'settings-unavailable', descriptor: null };
      }
      return { available: true, reason: 'ready', descriptor };
    } catch (error) {
      return {
        available: false,
        reason: 'settings-unavailable',
        descriptor: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  providersFrom(descriptor) {
    const providers = descriptor?.value?.providers;
    return providers && typeof providers === 'object' && !Array.isArray(providers) ? providers : {};
  }

  async describeKey(provider) {
    const ref = cleanString(provider?.apiKeyEnv, 100);
    const envValue = ref === '' ? '' : cleanString(this.env?.[ref], 2_000);
    if (ref === '' || this.credentials === undefined || typeof this.credentials.describe !== 'function') {
      return {
        configured: envValue !== '',
        writable: false,
        source: envValue === '' ? 'none' : 'env',
        ref,
      };
    }
    try {
      const info = await this.credentials.describe(ref);
      const configured = info?.configured === true || envValue !== '';
      return {
        configured,
        writable: info?.writable !== false,
        source: configured ? (info?.configured === true ? info.source : 'env') : (info?.source || 'none'),
        ref,
      };
    } catch {
      return {
        configured: envValue !== '',
        writable: false,
        source: envValue === '' ? 'none' : 'env',
        ref,
      };
    }
  }

  async describeConnection(preferredId = DEFAULT_PROVIDER_ID) {
    const resolved = await this.descriptor();
    if (!resolved.available) {
      return {
        available: false,
        reason: resolved.reason,
        error: resolved.error,
        configured: false,
        writable: false,
        provider: null,
        providers: [],
        key: { configured: false, writable: false, source: 'none', ref: '' },
        revision: undefined,
      };
    }
    const providers = this.providersFrom(resolved.descriptor);
    const views = Object.entries(providers)
      .filter(([, profile]) => profile && typeof profile === 'object')
      .map(([id, profile]) => providerView(id, profile));
    const selected = pickProvider(providers, cleanString(preferredId, 100) || DEFAULT_PROVIDER_ID);
    if (selected === null) {
      return {
        available: true,
        reason: 'provider-missing',
        configured: false,
        writable: this.settings.writable !== false,
        provider: null,
        providers: views,
        key: { configured: false, writable: this.settings.writable !== false, source: 'none', ref: '' },
        revision: resolved.descriptor.revision,
      };
    }
    const key = await this.describeKey(selected.profile);
    return {
      available: true,
      reason: key.configured ? 'ready' : 'key-missing',
      configured: key.configured,
      writable: this.settings.writable !== false,
      provider: providerView(selected.id, selected.profile),
      providers: views,
      key,
      revision: resolved.descriptor.revision,
    };
  }

  async ensureProvider(preferredId = DEFAULT_PROVIDER_ID) {
    const resolved = await this.descriptor();
    if (!resolved.available) {
      throw new Error(resolved.error || 'DSH model settings are unavailable');
    }
    if (this.settings.writable === false) {
      throw new Error('DSH model settings are read-only');
    }
    const providers = this.providersFrom(resolved.descriptor);
    const existing = pickProvider(providers, cleanString(preferredId, 100) || DEFAULT_PROVIDER_ID);
    if (existing !== null) {
      return { ...(await this.describeConnection(existing.id)), created: false };
    }
    const id = uniqueProviderId(providers, preferredId);
    const profile = cloneProfile(DEFAULT_PROVIDER_PROFILE);
    const ops = [{ op: 'set', path: ['providers', id], value: profile }];
    if (typeof this.settings.mutate !== 'function') {
      throw new Error('DSH model settings cannot be written');
    }
    await this.settings.mutate(LLM_PI_AI_NAMESPACE, ops, resolved.descriptor.revision);
    const state = await this.describeConnection(id);
    if (state.provider === null) {
      return {
        ...state,
        provider: providerView(id, profile),
        providers: [...state.providers, providerView(id, profile)],
        created: true,
      };
    }
    return { ...state, created: true };
  }

  async resolveApiKey(preferredId = DEFAULT_PROVIDER_ID) {
    const state = await this.describeConnection(preferredId);
    if (state.provider === null) return '';
    const ref = state.provider.apiKeyEnv;
    if (ref === '') return '';
    if (this.credentials !== undefined && typeof this.credentials.resolve === 'function') {
      try {
        const resolved = await this.credentials.resolve(ref);
        const value = typeof resolved === 'string' ? resolved : resolved?.value;
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
      } catch {
        // Fall through to the environment value when the credential store is unavailable.
      }
    }
    return cleanString(this.env?.[ref], 2_000);
  }

  async readBaseUrl(preferredId = DEFAULT_PROVIDER_ID) {
    const state = await this.describeConnection(preferredId);
    return state.provider?.baseUrl || '';
  }
}
