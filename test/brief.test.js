import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assessGenerationBrief, VIDEO_PRESETS } from '../lib/brief.js';
import { AgnesStudio } from '../lib/studio.js';

test('asks for a subject when an image or video brief is only a format or mood', () => {
  const image = assessGenerationBrief('image', { prompt: '帮我画一张好看的海报' });
  assert.equal(image.action, 'clarification');
  assert.equal(image.kind, 'image');
  assert.equal(image.status, 'needs_input');
  assert.deepEqual(image.missing, ['subject']);
  assert.equal(image.recommended, 'image-portrait');
  assert.ok(image.presets.some((preset) => preset.id === 'image-portrait'));

  const video = assessGenerationBrief('video', { prompt: '生成一段产品宣传视频' });
  assert.equal(video.action, 'clarification');
  assert.equal(video.kind, 'video');
  assert.equal(video.recommended, 'video-square');
  assert.ok(video.presets.some((preset) => preset.id === 'video-square'));
  assert.ok(video.presets.every((preset) => preset.resolution === '720P'));
});

test('keeps concrete or referenced briefs on the normal generation path', () => {
  assert.equal(assessGenerationBrief('image', { prompt: '画一只猫' }), null);
  assert.equal(assessGenerationBrief('image', { prompt: '一张适合做手机壁纸的唯美风景' }), null);
  assert.equal(assessGenerationBrief('video', { prompt: '咖啡杯在雨夜街道上缓慢旋转，电影感' }), null);
  assert.equal(assessGenerationBrief('image', { prompt: 'a cat walking in the rain' }), null);
  assert.equal(assessGenerationBrief('image', { prompt: '把这张图变成水彩' }), null);
  assert.equal(assessGenerationBrief('image', { prompt: '编辑这张图' }).action, 'clarification');
  assert.deepEqual(assessGenerationBrief('image', { prompt: '编辑这张图', images: ['https://example.test/input.png'] }).missing, ['instruction']);
  assert.equal(assessGenerationBrief('text', { prompt: '写一句标语' }), null);
});

test('selects a matching recommended preset from the stated use', () => {
  assert.equal(assessGenerationBrief('image', { prompt: '手机壁纸' }).recommended, 'image-phone');
  assert.equal(assessGenerationBrief('image', { prompt: '头像' }).recommended, 'image-square');
  assert.equal(assessGenerationBrief('video', { prompt: '抖音竖屏短视频' }).recommended, 'video-vertical');
  assert.equal(assessGenerationBrief('video', { prompt: '横屏宣传片' }).recommended, 'video-landscape');
});

test('a vague brief returns a clarification without calling the API or writing history', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agnes-brief-test-'));
  const calls = [];
  const studio = new AgnesStudio({
    rootDir: root,
    readApiKey: async () => 'test-key',
    fetchImpl: async (...args) => {
      calls.push(args);
      throw new Error('fetch should not run for a clarification');
    },
    defaultConfig: { baseUrl: 'http://mock.local/v1' },
  });
  try {
    const result = await studio.generate({ action: 'image', prompt: '画个图' });
    assert.equal(result.action, 'clarification');
    assert.equal(result.status, 'needs_input');
    assert.equal(calls.length, 0);
    assert.equal((await studio.listHistory()).total, 0);

    const video = await studio.generate({ action: 'video', prompt: '来一段视频' });
    assert.equal(video.action, 'clarification');
    assert.equal(video.kind, 'video');
    assert.equal(calls.length, 0);
    assert.equal((await studio.listHistory()).total, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
