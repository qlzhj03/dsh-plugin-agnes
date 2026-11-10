import { homedir } from 'node:os';
import { join } from 'node:path';
import { AgnesStudio } from './lib/studio.js';
import { DshModelProviders, DEFAULT_PROVIDER_ID } from './lib/dsh-models.js';

const TOOL_NAME = 'agnes_studio';
const ROUTE_PREFIX = '/api/agnes-studio';
const TOOL_GUIDANCE = 'Use the agnes_studio tool automatically when the user asks to create, generate, draw, edit, or animate an image or video, even without naming Agnes or this tool. Call it immediately with action: "image" or action: "video" instead of only describing the result. Also use it when the user explicitly asks Agnes to write standalone text or asks to see previous Agnes generations (action: "history"). Do not call it for ordinary conversation, general questions, or normal text replies.';

export const inject = ['tools', 'systemPrompt', 'webServer', 'settings', 'credentials'];

function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, value) {
  const body = JSON.stringify(value ?? null);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, error, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : String(error);
  const status = /not configured|api key/i.test(message) ? 401
    : /needs|must|cannot|required|invalid|unsupported|unavailable|too large|select an/i.test(message) ? 400
      : fallbackStatus;
  sendJson(res, status, { error: message });
}

async function configView(studio, models) {
  const config = await studio.readConfig();
  const connection = await models.describeConnection(config.providerId || DEFAULT_PROVIDER_ID);
  return {
    configured: connection.configured === true,
    connection,
    setup: {
      reason: connection.reason,
      writable: connection.writable !== false,
      canCreate: connection.available === true && connection.reason === 'provider-missing' && connection.writable !== false,
    },
    credentialWritable: connection.key?.writable !== false,
    credentialSource: connection.key?.source,
    envFallback: connection.key?.source === 'env',
    config,
    storageRoot: studio.root(),
    maxHistory: 500,
    docsUrl: 'https://www.agnes-ai.cn/zh-Hans/docs/overview',
  };
}

function resultSummary(value) {
  if (value?.action === 'history') {
    const items = Array.isArray(value.items) ? value.items : [];
    const lines = items.map((item) => `- ${item.kind} · ${item.status} · ${item.title || item.prompt || item.id}${item.mediaUrl ? ` · ${item.mediaUrl}` : ''}`);
    return [`Agnes history · ${value.total ?? items.length} item(s)`, ...lines].join('\n');
  }
  if (value?.kind === 'text') return value.text ?? '';
  if (value?.kind === 'image') return `Generated image: ${value.mediaUrl || value.remoteUrl || '(no URL)'}\nPrompt: ${value.prompt ?? ''}`;
  if (value?.kind === 'video') return `Generated video: ${value.mediaUrl || value.remoteUrl || '(no URL)'}\nPrompt: ${value.prompt ?? ''}`;
  return JSON.stringify(value);
}

function toolMeta(_args, value) {
  if (value?.action === 'history') {
    return {
      studio: 'agnes',
      action: 'history',
      items: value.items ?? [],
      total: value.total ?? 0,
      counts: value.counts ?? {},
    };
  }
  return {
    studio: 'agnes',
    action: value?.kind ?? 'unknown',
    record: value,
  };
}

function makeTool(studio) {
  return {
    name: TOOL_NAME,
    description: 'Generate text, images, or videos with Agnes AI and browse the user\'s saved generation history. Image and video results render inline in the conversation, and all results are saved automatically.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['text', 'image', 'video', 'history'],
        description: 'What to do. Use image for text-to-image or image editing, video for text/keyframe/reference video, text for a standalone Agnes text completion, history to list saved generations.',
      },
      prompt: {
        type: 'string',
        description: 'Required for text, image, and video. Write a detailed production-ready prompt.',
      },
      system: {
        type: 'string',
        description: 'Optional system instruction for action=text.',
      },
      maxTokens: {
        type: 'integer',
        description: 'Optional maximum output tokens for action=text.',
      },
      imageSize: {
        type: 'string',
        description: 'Image output tier for action=image: 1K, 2K, 3K, or 4K. Default 2K.',
      },
      ratio: {
        type: 'string',
        enum: ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9'],
        description: 'Image aspect ratio. Default 16:9.',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: 'For image: up to 8 public image URLs or data URIs used for image editing/composition. For video reference mode: up to 8 reference image URLs.',
      },
      videoMode: {
        type: 'string',
        enum: ['text', 'keyframe', 'reference'],
        description: 'Video generation mode. Default text.',
      },
      seconds: {
        type: 'string',
        description: 'Video duration from "4" to "12" seconds. Default "5".',
      },
      resolution: {
        type: 'string',
        enum: ['720P', '1080P', '1K', '2K'],
        description: 'Video resolution tier. Default 720P.',
      },
      aspectRatio: {
        type: 'string',
        enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
        description: 'Video aspect ratio. Default 16:9.',
      },
      firstFrame: {
        type: 'string',
        description: 'Public first-frame image URL for videoMode=keyframe.',
      },
      lastFrame: {
        type: 'string',
        description: 'Public last-frame image URL for videoMode=keyframe.',
      },
      audios: {
        type: 'array',
        items: { type: 'string' },
        description: 'Public audio reference URLs for videoMode=reference (up to 3).',
      },
      videos: {
        type: 'array',
        description: 'Reference video objects for videoMode=reference. Each object: { url, start_seconds?, require_audio? }.',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string', required: true },
            start_seconds: { type: 'number' },
            require_audio: { type: 'boolean' },
          },
        },
      },
      kind: {
        type: 'string',
        enum: ['text', 'image', 'video'],
        description: 'Optional filter for action=history.',
      },
      query: {
        type: 'string',
        description: 'Optional text search for action=history.',
      },
      limit: {
        type: 'integer',
        description: 'History page size, 1–100. Default 24.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {},
      },
      render: (_args, value) => [{ type: 'text', text: resultSummary(value).slice(0, 200_000) }],
      presentationMeta: toolMeta,
    },
    timeoutMs: 12 * 60_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const value = await studio.generate(args, { signal: exec.signal });
      return jsonSafe(value);
    },
  };
}

function mountRoutes(ctx, studio, models) {
  const route = async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://agnes-studio.local');
      const path = url.pathname.startsWith(ROUTE_PREFIX)
        ? url.pathname.slice(ROUTE_PREFIX.length) || '/'
        : url.pathname;
      const method = req.method ?? 'GET';

      if (path === '/config' && method === 'GET') {
        sendJson(res, 200, await configView(studio, models));
        return;
      }

      if (path === '/config' && method === 'POST') {
        const body = await readBody(req, 64 * 1024);
        if (Object.hasOwn(body, 'apiKey') || body.clearApiKey === true || Object.hasOwn(body, 'baseUrl')) {
          throw new Error('API keys and Base URLs cannot be changed here. Use DSH Settings → Models.');
        }
        const stored = await studio.readStoredConfig();
        const current = await models.describeConnection(stored.providerId || DEFAULT_PROVIDER_ID);
        const patch = {};
        for (const key of ['textModel', 'imageModel', 'videoModel']) {
          if (Object.hasOwn(body, key)) patch[key] = body[key];
        }
        if (Object.hasOwn(body, 'providerId')) {
          const chosen = current.providers.find((provider) => provider.id === body.providerId);
          if (chosen === undefined || chosen.agnes !== true) throw new Error('Select an Agnes model provider');
          patch.providerId = chosen.id;
        }
        await studio.saveConfig(patch);
        sendJson(res, 200, { ok: true, ...(await configView(studio, models)) });
        return;
      }

      if (path === '/setup' && method === 'POST') {
        const body = await readBody(req, 64 * 1024);
        const stored = await studio.readStoredConfig();
        const preferred = typeof body.providerId === 'string' && body.providerId.trim() !== ''
          ? body.providerId.trim()
          : stored.providerId || DEFAULT_PROVIDER_ID;
        const result = await models.ensureProvider(preferred);
        if (result.provider?.id) await studio.saveConfig({ providerId: result.provider.id });
        sendJson(res, 200, {
          ok: true,
          created: result.created === true,
          ...(await configView(studio, models)),
        });
        return;
      }

      if (path === '/history' && method === 'GET') {
        const result = await studio.listHistory({
          kind: url.searchParams.get('kind') ?? '',
          query: url.searchParams.get('q') ?? '',
          limit: Number(url.searchParams.get('limit') ?? 100),
          offset: Number(url.searchParams.get('offset') ?? 0),
        });
        sendJson(res, 200, result);
        return;
      }

      if (path.startsWith('/history/') && method === 'DELETE') {
        const id = decodeURIComponent(path.slice('/history/'.length));
        const removed = await studio.deleteHistory(id);
        sendJson(res, removed ? 200 : 404, { ok: removed });
        return;
      }

      if (path.startsWith('/media/') && (method === 'GET' || method === 'HEAD')) {
        const fileName = decodeURIComponent(path.slice('/media/'.length));
        const info = await studio.mediaInfo(fileName);
        if (info === null) {
          sendJson(res, 404, { error: 'Media not found' });
          return;
        }
        const headers = {
          'content-type': info.mediaType,
          'cache-control': 'private, max-age=3600',
          'accept-ranges': 'bytes',
        };
        const range = req.headers.range;
        if (typeof range === 'string') {
          const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
          if (match === null) {
            res.writeHead(416, { 'content-range': `bytes */${info.size}` });
            res.end();
            return;
          }
          const start = match[1] === '' ? Math.max(0, info.size - Number(match[2] || 0)) : Number(match[1]);
          const end = match[2] === '' || match[1] === '' ? info.size - 1 : Math.min(info.size - 1, Number(match[2]));
          if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= info.size) {
            res.writeHead(416, { 'content-range': `bytes */${info.size}` });
            res.end();
            return;
          }
          res.writeHead(206, {
            ...headers,
            'content-range': `bytes ${start}-${end}/${info.size}`,
            'content-length': end - start + 1,
          });
          if (method === 'HEAD') {
            res.end();
            return;
          }
          const stream = studio.createReadStream(info.path, { start, end });
          stream.on('error', () => res.destroy());
          res.on('close', () => stream.destroy());
          stream.pipe(res);
          return;
        }
        res.writeHead(200, { ...headers, 'content-length': info.size });
        if (method === 'HEAD') {
          res.end();
          return;
        }
        const stream = studio.createReadStream(info.path);
        stream.on('error', () => res.destroy());
        res.on('close', () => stream.destroy());
        stream.pipe(res);
        return;
      }

      if (path === '/generate' && method === 'POST') {
        const body = await readBody(req, 2 * 1024 * 1024);
        const result = await studio.generate({ ...body, source: 'studio' });
        sendJson(res, 200, jsonSafe(result));
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      sendError(res, error);
    }
  };
  return ctx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: route });
}

export function apply(ctx) {
  const profileDir = process.env.DSH_PROFILE_DIR;
  const rootDir = join(profileDir && profileDir !== '' ? profileDir : join(homedir(), '.dsh'), 'agnes-studio');
  const credentials = ctx.get('credentials');
  const settings = ctx.get('settings');
  const models = new DshModelProviders({ settings, credentials });
  const defaultConfig = {};
  if (typeof process.env.AGNES_BASE_URL === 'string' && process.env.AGNES_BASE_URL.trim() !== '') {
    defaultConfig.baseUrl = process.env.AGNES_BASE_URL.trim();
  }
  const studio = new AgnesStudio({
    rootDir,
    defaultConfig,
    async readApiKey() {
      const stored = await studio.readStoredConfig();
      const connection = await models.describeConnection(stored.providerId || DEFAULT_PROVIDER_ID);
      if (connection.available === false) {
        throw new Error(connection.error || 'DSH model settings are unavailable');
      }
      return models.resolveApiKey(stored.providerId || DEFAULT_PROVIDER_ID);
    },
    async readBaseUrl() {
      const stored = await studio.readStoredConfig();
      return models.readBaseUrl(stored.providerId || DEFAULT_PROVIDER_ID);
    },
  });
  void studio.initialize();

  ctx.effect(() => mountRoutes(ctx, studio, models), 'agnes-studio: HTTP routes');
  ctx.effect(() => ctx.tools.register(makeTool(studio)), 'agnes-studio: tool');
  ctx.systemPrompt.section({
    name: `tool:${TOOL_NAME}`,
    order: ctx.systemPrompt.getSectionOrder('TOOL_WORKFLOW') + 50,
    text: ({ scope }) => ctx.tools.get(TOOL_NAME, scope) === undefined ? '' : TOOL_GUIDANCE,
  });
}
