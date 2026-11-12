import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { assessGenerationBrief } from './brief.js';

export const DEFAULT_CONFIG = Object.freeze({
  providerId: 'agnes',
  baseUrl: 'https://api.agnes-ai.cn/v1',
  textModel: 'agnes-3.0-flash',
  imageModel: 'agnes-image-2.5-flash',
  videoModel: 'agnes-video-2.5-flash',
});
export const MAX_HISTORY = 500;
const MAX_TEXT_CHARS = 200_000;
const VIDEO_POLL_MS = 2_000;
const VIDEO_POLL_TIMEOUT_MS = 10 * 60_000;

const IMAGE_RATIOS = new Set(['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9']);
const VIDEO_MODES = new Set(['text', 'keyframe', 'reference']);
const VIDEO_RESOLUTIONS = new Set(['720P']);
const VIDEO_ASPECTS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4', '21:9']);

function cleanString(value, max = 100_000) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return text.length > max ? text.slice(0, max) : text;
}

function cleanStringArray(value, maxItems = 8) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim() !== '')
    .slice(0, maxItems)
    .map((item) => item.trim());
}

function safeError(error) {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'Unknown Agnes API error';
}

function titleFromPrompt(prompt, kind) {
  const compact = prompt.replace(/\s+/g, ' ').trim();
  if (compact === '') return kind === 'image' ? 'Untitled image' : kind === 'video' ? 'Untitled video' : 'Untitled text';
  return compact.length > 80 ? `${compact.slice(0, 77)}…` : compact;
}

function isDisplayableHistoryRecord(record) {
  const hasMedia = Boolean(record?.media?.fileName || record?.remoteUrl);
  if (record?.status === 'failed') return hasMedia;
  if (record?.kind === 'image' || record?.kind === 'video') return hasMedia;
  return true;
}

function extensionFor(contentType, url = '') {
  const type = (contentType || '').split(';', 1)[0].trim().toLowerCase();
  const byType = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  if (byType[type] !== undefined) return byType[type];
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  if (match !== null) {
    const extension = match[1].toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
  }
  return type.startsWith('video/') ? 'mp4' : 'png';
}

function mediaTypeForExtension(fileName) {
  const extension = extname(fileName).slice(1).toLowerCase();
  return {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  }[extension] || 'application/octet-stream';
}

function base64Payload(value) {
  if (typeof value !== 'string' || value === '') return null;
  const comma = value.indexOf(',');
  const header = comma >= 0 ? value.slice(0, comma) : '';
  const data = comma >= 0 && header.startsWith('data:') ? value.slice(comma + 1) : value;
  const mimeMatch = /^data:([^;,]+)/.exec(header);
  return {
    bytes: Buffer.from(data, 'base64'),
    mediaType: mimeMatch?.[1] || 'image/png',
  };
}

function extractAssistantText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part !== null && typeof part === 'object' && typeof part.text === 'string') return part.text;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function statusText(status) {
  return typeof status === 'string' ? status.toLowerCase() : '';
}

function responseError(data, raw, status) {
  const nested = data?.error;
  const message = typeof nested === 'string'
    ? nested
    : typeof nested?.message === 'string'
      ? nested.message
      : typeof data?.message === 'string'
        ? data.message
        : raw;
  const compact = String(message || '').replace(/\s+/g, ' ').trim().slice(0, 800);
  return `Agnes API ${status}${compact ? `: ${compact}` : ''}`;
}

/**
 * Host-side Agnes API adapter and durable media store.
 * The browser never sees the key or raw filesystem paths.
 */
export class AgnesStudio {
  constructor({ rootDir, readApiKey, readBaseUrl, fetchImpl = fetch, now = Date.now, sleep, pollMs = VIDEO_POLL_MS, defaultConfig = {} }) {
    if (typeof rootDir !== 'string' || rootDir === '') throw new Error('AgnesStudio requires a rootDir');
    if (typeof readApiKey !== 'function') throw new Error('AgnesStudio requires readApiKey');
    this.rootDir = rootDir;
    this.mediaDir = join(rootDir, 'media');
    this.historyPath = join(rootDir, 'history.json');
    this.configPath = join(rootDir, 'config.json');
    this.defaultConfig = { ...DEFAULT_CONFIG, ...defaultConfig };
    this.readApiKey = readApiKey;
    this.readBaseUrl = typeof readBaseUrl === 'function' ? readBaseUrl : null;
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.sleep = sleep || ((ms, signal) => new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason ?? new Error('Generation cancelled'));
        return;
      }
      const finish = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        resolve();
      };
      const timer = setTimeout(finish, ms);
      const onAbort = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        reject(signal.reason ?? new Error('Generation cancelled'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    }));
    this.pollMs = pollMs;
    this.ready = null;
    this.historyQueue = Promise.resolve();
  }

  async initialize() {
    if (this.ready === null) {
      this.ready = mkdir(this.mediaDir, { recursive: true }).catch((error) => {
        this.ready = null;
        throw error;
      });
    }
    await this.ready;
  }

  root() {
    return this.rootDir;
  }

  async readStoredConfig() {
    await this.initialize();
    try {
      const parsed = JSON.parse(await readFile(this.configPath, 'utf8'));
      return {
        ...this.defaultConfig,
        ...Object.fromEntries(Object.entries(parsed && typeof parsed === 'object' ? parsed : {}).filter(([, value]) => typeof value === 'string' && value.trim() !== '')),
      };
    } catch (error) {
      if (error?.code === 'ENOENT') return { ...this.defaultConfig };
      throw error;
    }
  }

  async readConfig() {
    const stored = await this.readStoredConfig();
    let baseUrl = stored.baseUrl;
    if (this.readBaseUrl !== null) {
      try {
        const official = cleanString(await this.readBaseUrl(), 500);
        if (official !== '') baseUrl = this.normalizeBaseUrl(official);
      } catch {
        // A missing DSH provider keeps the fallback URL; generation will
        // still report the missing API key before any network request.
      }
    }
    return { ...stored, baseUrl };
  }

  async saveConfig(patch) {
    await this.initialize();
    const current = await this.readStoredConfig();
    const next = { ...current };
    if (Object.hasOwn(patch ?? {}, 'providerId')) {
      const value = cleanString(patch.providerId, 200);
      if (value === '') throw new Error('providerId cannot be empty');
      next.providerId = value;
    }
    if (Object.hasOwn(patch ?? {}, 'baseUrl')) {
      next.baseUrl = this.normalizeBaseUrl(patch.baseUrl);
    }
    for (const key of ['textModel', 'imageModel', 'videoModel']) {
      if (Object.hasOwn(patch ?? {}, key)) {
        const value = cleanString(patch[key], 200);
        if (value === '') throw new Error(`${key} cannot be empty`);
        next[key] = value;
      }
    }
    const temporary = `${this.configPath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await rename(temporary, this.configPath);
    return next;
  }

  normalizeBaseUrl(value) {
    const text = cleanString(value, 500).replace(/\/+$/, '');
    if (text === '') throw new Error('Base URL cannot be empty');
    let url;
    try {
      url = new URL(text);
    } catch {
      throw new Error('Base URL must be a valid http(s) URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Base URL must use http or https');
    }
    return text;
  }

  async apiKey() {
    const value = await this.readApiKey();
    const key = cleanString(value, 2_000);
    if (key === '') {
      throw new Error('Agnes API key is not configured. Open Settings → Agnes Studio → Settings to create the Agnes provider, then add its API Key in Settings → Models.');
    }
    return key;
  }

  async listModels({ signal } = {}) {
    const config = await this.readConfig();
    const data = await this.requestJson(`${config.baseUrl}/models`, {
      method: 'GET',
      headers: await this.headers({ json: false }),
    }, { signal, timeoutMs: 30_000 });
    const items = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
        ? data.models
        : Array.isArray(data)
          ? data
          : null;
    if (items === null) throw new Error('Agnes returned an unrecognized model list');
    const seen = new Set();
    const models = [];
    for (const item of items) {
      const id = cleanString(typeof item === 'string' ? item : item?.id, 200);
      if (id === '' || seen.has(id)) continue;
      const endpoints = Array.isArray(item?.supported_endpoint_types)
        ? item.supported_endpoint_types.filter((entry) => typeof entry === 'string' && entry !== '')
        : null;
      if (endpoints !== null && !endpoints.includes('openai')) continue;
      seen.add(id);
      const name = cleanString(typeof item === 'object' ? item?.name : '', 200);
      models.push({
        id,
        ...(name !== '' && name !== id ? { name } : {}),
      });
    }
    models.sort((left, right) => left.id.localeCompare(right.id));
    return { baseUrl: config.baseUrl, models };
  }

  async requestJson(url, init = {}, { signal, timeoutMs = 120_000 } = {}) {
    if (signal?.aborted) throw signal.reason ?? new Error('Generation cancelled');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Agnes request timed out after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
    const onAbort = () => controller.abort(signal?.reason ?? new Error('Generation cancelled'));
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
      const raw = await response.text();
      let data = null;
      if (raw !== '') {
        try {
          data = JSON.parse(raw);
        } catch {
          data = null;
        }
      }
      if (!response.ok) throw new Error(responseError(data, raw, response.status));
      if (data === null) throw new Error('Agnes API returned a non-JSON response');
      return data;
    } catch (error) {
      if (controller.signal.aborted && controller.signal.reason instanceof Error) throw controller.signal.reason;
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  async headers({ json = true } = {}) {
    const key = await this.apiKey();
    return {
      Authorization: `Bearer ${key}`,
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    };
  }

  async history() {
    await this.initialize();
    try {
      const parsed = JSON.parse(await readFile(this.historyPath, 'utf8'));
      return Array.isArray(parsed) ? parsed.filter((record) => record && typeof record === 'object') : [];
    } catch (error) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  }

  async withHistory(operation) {
    const next = this.historyQueue.then(operation, operation);
    this.historyQueue = next.catch(() => {});
    return next;
  }

  async addHistory(record) {
    return this.withHistory(async () => {
      const current = await this.history();
      const next = [record, ...current.filter((item) => item.id !== record.id)].slice(0, MAX_HISTORY);
      const temporary = `${this.historyPath}.${process.pid}.tmp`;
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      await rename(temporary, this.historyPath);
      return record;
    });
  }

  publicRecord(record) {
    if (record === null || typeof record !== 'object') return record;
    const mediaUrl = record.media?.fileName
      ? `/api/agnes-studio/media/${encodeURIComponent(record.media.fileName)}`
      : record.remoteUrl;
    return {
      ...record,
      mediaUrl,
      localUrl: record.media?.fileName ? mediaUrl : undefined,
    };
  }

  async listHistory({ kind = '', limit = 100, offset = 0, query = '' } = {}) {
    const records = (await this.history()).filter(isDisplayableHistoryRecord);
    const validKinds = new Set(['text', 'image', 'video']);
    const needle = cleanString(query, 200).toLowerCase();
    const filtered = records.filter((record) => {
      if (validKinds.has(kind) && record.kind !== kind) return false;
      if (needle === '') return true;
      return [record.title, record.prompt, record.text].some((value) => typeof value === 'string' && value.toLowerCase().includes(needle));
    });
    const counts = { all: records.length, text: 0, image: 0, video: 0 };
    for (const record of records) {
      if (Object.hasOwn(counts, record.kind)) counts[record.kind] += 1;
    }
    const start = Math.max(0, Number.isFinite(offset) ? Math.trunc(offset) : 0);
    const take = Math.min(200, Math.max(1, Number.isFinite(limit) ? Math.trunc(limit) : 100));
    return {
      items: filtered.slice(start, start + take).map((record) => this.publicRecord(record)),
      total: filtered.length,
      counts,
    };
  }

  async deleteHistory(id) {
    let removed = null;
    await this.withHistory(async () => {
      const current = await this.history();
      removed = current.find((record) => record.id === id) ?? null;
      const next = current.filter((record) => record.id !== id);
      const temporary = `${this.historyPath}.${process.pid}.tmp`;
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      await rename(temporary, this.historyPath);
    });
    if (removed?.media?.fileName) {
      await unlink(join(this.mediaDir, basename(removed.media.fileName))).catch(() => {});
    }
    return removed !== null;
  }

  async mediaInfo(fileName) {
    const safeName = basename(fileName);
    if (safeName !== fileName || !/^[a-zA-Z0-9._-]+$/.test(safeName)) return null;
    const record = (await this.history()).find((item) => item.media?.fileName === safeName);
    if (record === undefined) return null;
    const path = join(this.mediaDir, safeName);
    const info = await stat(path).catch(() => null);
    if (info === null || !info.isFile()) return null;
    return {
      path,
      size: info.size,
      mediaType: record.media?.mediaType || mediaTypeForExtension(safeName),
    };
  }

  createReadStream(path, options) {
    return createReadStream(path, options);
  }

  async saveMedia(id, { url, base64 }, signal) {
    if (base64 !== null && base64 !== undefined) {
      const payload = base64Payload(base64);
      if (payload === null || payload.bytes.length === 0) throw new Error('Agnes returned empty image data');
      const extension = extensionFor(payload.mediaType);
      const fileName = `${id}.${extension}`;
      await writeFile(join(this.mediaDir, fileName), payload.bytes);
      return {
        fileName,
        mediaType: payload.mediaType,
        bytes: payload.bytes.length,
      };
    }
    if (typeof url !== 'string' || url === '') throw new Error('Agnes returned no media URL');
    const response = await this.fetchImpl(url, { signal });
    if (!response.ok) throw new Error(`Unable to download generated media (${response.status})`);
    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim() || extensionFor('', url);
    const extension = extensionFor(contentType, url);
    const fileName = `${id}.${extension}`;
    const destination = join(this.mediaDir, fileName);
    const temporary = `${destination}.${process.pid}.tmp`;
    try {
      if (response.body !== null && typeof response.body?.getReader === 'function') {
        await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
      } else {
        await writeFile(temporary, Buffer.from(await response.arrayBuffer()));
      }
      await rename(temporary, destination);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw error;
    }
    const info = await stat(destination);
    return {
      fileName,
      mediaType: contentType.startsWith('image/') || contentType.startsWith('video/') ? contentType : mediaTypeForExtension(fileName),
      bytes: info.size,
    };
  }

  async generateText(input, signal) {
    const prompt = cleanString(input.prompt, MAX_TEXT_CHARS);
    if (prompt === '') throw new Error('Text generation needs a prompt');
    const config = await this.readConfig();
    const messages = [];
    const system = cleanString(input.system, 20_000);
    if (system !== '') messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    const body = { model: config.textModel, messages, stream: false };
    if (Number.isFinite(input.maxTokens)) body.max_tokens = Math.max(1, Math.min(32_000, Math.trunc(input.maxTokens)));
    const data = await this.requestJson(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify(body),
    }, { signal, timeoutMs: 180_000 });
    const text = extractAssistantText(data?.choices?.[0]?.message?.content);
    if (text === '') throw new Error('Agnes returned an empty text response');
    const record = {
      id: `txt_${randomUUID()}`,
      kind: 'text',
      status: 'completed',
      title: titleFromPrompt(prompt, 'text'),
      prompt,
      text,
      model: config.textModel,
      createdAt: new Date(this.now()).toISOString(),
      source: cleanString(input.source, 40) || 'chat',
    };
    await this.addHistory(record);
    return this.publicRecord(record);
  }

  async generateImage(input, signal) {
    const prompt = cleanString(input.prompt, MAX_TEXT_CHARS);
    if (prompt === '') throw new Error('Image generation needs a prompt');
    const config = await this.readConfig();
    const imageSize = cleanString(input.imageSize, 20) || '2K';
    const ratio = IMAGE_RATIOS.has(input.ratio) ? input.ratio : '16:9';
    const references = cleanStringArray(input.images, 8);
    const extraBody = { response_format: 'url' };
    if (references.length > 0) extraBody.image = references;
    const body = {
      model: config.imageModel,
      prompt,
      size: imageSize,
      ratio,
      extra_body: extraBody,
    };
    const data = await this.requestJson(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify(body),
    }, { signal, timeoutMs: 180_000 });
    const first = Array.isArray(data?.data) ? data.data[0] : null;
    if (first === null || (typeof first?.url !== 'string' && typeof first?.b64_json !== 'string')) {
      throw new Error('Agnes returned no image');
    }
    const id = `img_${randomUUID()}`;
    let media = null;
    let mediaError = '';
    try {
      media = await this.saveMedia(id, {
        url: typeof first.url === 'string' ? first.url : undefined,
        base64: typeof first.b64_json === 'string' ? first.b64_json : undefined,
      }, signal);
    } catch (error) {
      mediaError = safeError(error);
    }
    const record = {
      id,
      kind: 'image',
      status: 'completed',
      title: titleFromPrompt(prompt, 'image'),
      prompt,
      model: config.imageModel,
      createdAt: new Date(this.now()).toISOString(),
      imageSize,
      ratio,
      referenceCount: references.length,
      remoteUrl: typeof first.url === 'string' ? first.url : undefined,
      media,
      ...(mediaError === '' ? {} : { mediaError }),
      source: cleanString(input.source, 40) || 'chat',
    };
    await this.addHistory(record);
    return this.publicRecord(record);
  }

  async generateVideo(input, signal) {
    const prompt = cleanString(input.prompt, MAX_TEXT_CHARS);
    if (prompt === '') throw new Error('Video generation needs a prompt');
    const config = await this.readConfig();
    const mode = VIDEO_MODES.has(input.videoMode) ? input.videoMode : 'text';
    const seconds = String(Math.max(4, Math.min(12, Number.parseInt(input.seconds, 10) || 5)));
    const resolution = VIDEO_RESOLUTIONS.has(input.resolution) ? input.resolution : '720P';
    const aspectRatio = VIDEO_ASPECTS.has(input.aspectRatio) ? input.aspectRatio : '16:9';
    const firstFrame = cleanString(input.firstFrame, 2_000);
    const lastFrame = cleanString(input.lastFrame, 2_000);
    const images = cleanStringArray(input.images, 8);
    const audios = cleanStringArray(input.audios, 3);
    const videos = Array.isArray(input.videos)
      ? input.videos.filter((item) => item && typeof item.url === 'string').slice(0, 1).map((item) => ({
        url: cleanString(item.url, 2_000),
        ...(Number.isFinite(item.start_seconds) ? { start_seconds: Math.max(0, item.start_seconds) } : {}),
        ...(item.require_audio === true ? { require_audio: true } : {}),
      }))
      : [];
    if (mode === 'keyframe' && firstFrame === '' && lastFrame === '') {
      throw new Error('Keyframe video needs a first frame or last frame URL');
    }
    if (mode === 'reference' && images.length === 0 && audios.length === 0 && videos.length === 0) {
      throw new Error('Reference video needs at least one image, audio, or video reference');
    }
    const body = {
      model: config.videoModel,
      prompt,
      mode,
      seconds,
      size: resolution,
      aspect_ratio: aspectRatio,
    };
    if (mode === 'keyframe') {
      if (firstFrame !== '') body.first_frame = firstFrame;
      if (lastFrame !== '') body.last_frame = lastFrame;
    }
    if (mode === 'reference') {
      if (images.length > 0) body.images = images;
      if (audios.length > 0) body.audios = audios;
      if (videos.length > 0) body.videos = videos;
    }
    const created = await this.requestJson(`${config.baseUrl}/videos`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify(body),
    }, { signal, timeoutMs: 180_000 });
    const videoId = cleanString(created?.video_id || created?.id, 200);
    if (videoId === '') throw new Error('Agnes returned no video_id');
    const origin = new URL(config.baseUrl).origin;
    const query = new URL(`${origin}/agnesapi`);
    query.searchParams.set('video_id', videoId);
    query.searchParams.set('model_name', config.videoModel);
    const deadline = this.now() + (Number.isFinite(input.timeoutMs) ? Math.max(30_000, input.timeoutMs) : VIDEO_POLL_TIMEOUT_MS);
    let final = null;
    while (this.now() < deadline) {
      const current = await this.requestJson(query.toString(), {
        method: 'GET',
        headers: await this.headers({ json: false }),
      }, { signal, timeoutMs: 60_000 });
      const status = statusText(current?.status);
      if (status === 'completed') {
        final = current;
        break;
      }
      if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
        throw new Error(`Agnes video generation failed${current?.error ? `: ${typeof current.error === 'string' ? current.error : current.error.message || JSON.stringify(current.error)}` : ''}`);
      }
      await this.sleep(this.pollMs, signal);
    }
    if (final === null) throw new Error('Agnes video generation timed out');
    const remoteUrl = cleanString(final?.url || final?.video?.url, 4_000);
    if (remoteUrl === '') throw new Error('Agnes completed the video without a URL');
    const id = `vid_${randomUUID()}`;
    let media = null;
    let mediaError = '';
    try {
      media = await this.saveMedia(id, { url: remoteUrl }, signal);
    } catch (error) {
      mediaError = safeError(error);
    }
    const record = {
      id,
      kind: 'video',
      status: 'completed',
      title: titleFromPrompt(prompt, 'video'),
      prompt,
      model: config.videoModel,
      createdAt: new Date(this.now()).toISOString(),
      videoId,
      mode,
      seconds,
      resolution,
      aspectRatio,
      remoteUrl,
      media,
      ...(mediaError === '' ? {} : { mediaError }),
      source: cleanString(input.source, 40) || 'chat',
    };
    await this.addHistory(record);
    return this.publicRecord(record);
  }

  async generate(input = {}, options = {}) {
    const action = cleanString(input.action, 20).toLowerCase();
    if (action === 'history') {
      return {
        action: 'history',
        ...(await this.listHistory({ kind: cleanString(input.kind, 20), limit: Number(input.limit) || 24, query: input.query })),
      };
    }
    if (!['text', 'image', 'video'].includes(action)) {
      throw new Error('action must be text, image, video, or history');
    }
    if (action !== 'text') {
      const clarification = assessGenerationBrief(action, input);
      if (clarification !== null) return clarification;
    }
    const startedAt = this.now();
    try {
      if (action === 'text') return await this.generateText(input, options.signal);
      if (action === 'image') return await this.generateImage(input, options.signal);
      return await this.generateVideo(input, options.signal);
    } catch (error) {
      const failed = {
        id: `${action.slice(0, 3)}_${randomUUID()}`,
        kind: action,
        status: 'failed',
        title: titleFromPrompt(cleanString(input.prompt, 500), action),
        prompt: cleanString(input.prompt, MAX_TEXT_CHARS),
        model: action === 'text' ? (await this.readConfig()).textModel : action === 'image' ? (await this.readConfig()).imageModel : (await this.readConfig()).videoModel,
        createdAt: new Date(startedAt).toISOString(),
        error: safeError(error),
        source: cleanString(input.source, 40) || 'chat',
      };
      await this.addHistory(failed).catch(() => {});
      throw error;
    }
  }
}
