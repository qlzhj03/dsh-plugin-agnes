import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AgnesStudio, DEFAULT_CONFIG } from '../lib/studio.js';

const PNG_BYTES = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const MP4_BYTES = Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex');

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function mediaResponse(bytes, contentType) {
  return new Response(bytes, { status: 200, headers: { 'content-type': contentType } });
}

function createMockFetch(calls) {
  let polls = 0;
  return async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const target = String(url);
    if (target.endsWith('/chat/completions')) {
      return jsonResponse({ choices: [{ message: { content: 'Hello from Agnes.' } }] });
    }
    if (target.endsWith('/images/generations')) {
      return jsonResponse({ data: [{ url: 'http://mock.local/generated.png' }] });
    }
    if (target.endsWith('/videos') && init.method === 'POST') {
      return jsonResponse({ video_id: 'video_test', status: 'queued' });
    }
    if (target.includes('/agnesapi?')) {
      polls += 1;
      return jsonResponse(polls === 1
        ? { status: 'in_progress', progress: 40 }
        : { status: 'completed', progress: 100, url: 'http://mock.local/generated.mp4' });
    }
    if (target === 'http://mock.local/generated.png') return mediaResponse(PNG_BYTES, 'image/png');
    if (target === 'http://mock.local/generated.mp4') return mediaResponse(MP4_BYTES, 'video/mp4');
    return jsonResponse({ error: { message: `unexpected URL: ${target}` } }, 500);
  };
}

test('AgnesStudio generates text, image, and video and persists history/media', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-studio-test-'));
  const calls = [];
  let clock = Date.parse('2026-11-08T07:00:00.000Z');
  const studio = new AgnesStudio({
    rootDir: root,
    readApiKey: async () => 'test-key',
    fetchImpl: createMockFetch(calls),
    now: () => (clock += 1000),
    sleep: async () => {},
    defaultConfig: {
      baseUrl: 'http://mock.local/v1',
      textModel: 'agnes-3.0-flash',
      imageModel: 'agnes-image-2.5-flash',
      videoModel: 'agnes-video-2.5-flash',
    },
  });

  try {
    const text = await studio.generate({ action: 'text', prompt: 'Write a tagline', source: 'test' });
    assert.equal(text.kind, 'text');
    assert.equal(text.text, 'Hello from Agnes.');
    assert.equal(text.source, 'test');

    const image = await studio.generate({
      action: 'image',
      prompt: 'A blue glass cube',
      imageSize: '2K',
      ratio: '16:9',
      images: ['https://example.com/input.png'],
      source: 'test',
    });
    assert.equal(image.kind, 'image');
    assert.match(image.mediaUrl, /^\/api\/agnes-studio\/media\/img_.+\.png$/);
    assert.equal(image.localUrl, image.mediaUrl);
    const imageCall = calls.find((call) => call.url.endsWith('/images/generations'));
    const imageBody = JSON.parse(imageCall.init.body);
    assert.deepEqual(imageBody.extra_body, {
      response_format: 'url',
      image: ['https://example.com/input.png'],
    });
    assert.equal(imageBody.ratio, '16:9');

    const video = await studio.generate({
      action: 'video',
      prompt: 'A silver car on a rainy neon street',
      videoMode: 'text',
      seconds: '5',
      resolution: '720P',
      aspectRatio: '16:9',
      source: 'test',
    });
    assert.equal(video.kind, 'video');
    assert.match(video.mediaUrl, /^\/api\/agnes-studio\/media\/vid_.+\.mp4$/);
    assert.equal(video.seconds, '5');

    const history = await studio.listHistory();
    assert.equal(history.total, 3);
    assert.deepEqual(history.counts, { all: 3, text: 1, image: 1, video: 1 });
    assert.equal(history.items[0].kind, 'video');

    const imageName = image.media.fileName;
    const media = await studio.mediaInfo(imageName);
    assert.ok(media);
    assert.equal(media.mediaType, 'image/png');
    assert.ok((await readFile(media.path)).length > 0);

    const removed = await studio.deleteHistory(image.id);
    assert.equal(removed, true);
    await assert.rejects(access(join(root, 'media', imageName)));
    assert.equal((await studio.listHistory()).total, 2);

    const rawHistory = await readFile(join(root, 'history.json'), 'utf8');
    assert.ok(!rawHistory.includes('test-key'));
    assert.ok(!rawHistory.includes(root));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('AgnesStudio validates configuration and reports API failures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-studio-test-'));
  const studio = new AgnesStudio({
    rootDir: root,
    readApiKey: async () => '',
    fetchImpl: async () => {
      throw new Error('fetch should not run without a key');
    },
  });
  try {
    await assert.rejects(
      studio.generate({ action: 'image', prompt: 'a blue cube' }),
      /API key is not configured/,
    );
    await assert.rejects(studio.saveConfig({ baseUrl: 'file:///tmp/nope' }), /http or https/);
    const history = await studio.listHistory();
    assert.equal(history.items[0].status, 'failed');
    assert.match(history.items[0].error, /API key is not configured/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('AgnesStudio prefers the DSH model provider base URL over the legacy file value', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-studio-test-'));
  const calls = [];
  const studio = new AgnesStudio({
    rootDir: root,
    readApiKey: async () => 'test-key',
    readBaseUrl: async () => 'http://official.local/v1',
    fetchImpl: createMockFetch(calls),
    defaultConfig: {
      baseUrl: 'https://api.agnes-ai.cn/v1',
      textModel: 'agnes-3.0-flash',
      imageModel: 'agnes-image-2.5-flash',
      videoModel: 'agnes-video-2.5-flash',
    },
  });
  try {
    await studio.generate({ action: 'text', prompt: 'Write a tagline' });
    assert.equal(calls[0].url, 'http://official.local/v1/chat/completions');
    assert.equal((await studio.readConfig()).baseUrl, 'http://official.local/v1');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('AgnesStudio lists and normalizes the provider model catalog', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-studio-test-'));
  const calls = [];
  const studio = new AgnesStudio({
    rootDir: root,
    readApiKey: async () => 'test-key',
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return jsonResponse({
        object: 'list',
        data: [
          { id: 'agnes-video-2.5', object: 'model' },
          { id: 'agnes-3.0-flash', name: 'Agnes 3.0 Flash' },
          { id: 'agnes-3.0-flash' },
          { id: 'agnes-2.5-pro-theta', supported_endpoint_types: [] },
          { name: 'missing id' },
          { id: '  agnes-image-2.5-flash  ' },
        ],
      });
    },
    defaultConfig: {
      baseUrl: 'http://mock.local/v1',
      textModel: 'agnes-3.0-flash',
      imageModel: 'agnes-image-2.5-flash',
      videoModel: 'agnes-video-2.5-flash',
    },
  });
  try {
    const result = await studio.listModels();
    assert.equal(result.baseUrl, 'http://mock.local/v1');
    assert.deepEqual(result.models, [
      { id: 'agnes-3.0-flash', name: 'Agnes 3.0 Flash' },
      { id: 'agnes-image-2.5-flash' },
      { id: 'agnes-video-2.5' },
    ]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://mock.local/v1/models');
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer test-key');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ships the install defaults for text, image, and video models', () => {
  assert.equal(DEFAULT_CONFIG.textModel, 'agnes-3.0-flash');
  assert.equal(DEFAULT_CONFIG.imageModel, 'agnes-image-2.5-flash');
  assert.equal(DEFAULT_CONFIG.videoModel, 'agnes-video-2.5-flash');
});
