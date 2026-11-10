const IMAGE_PRESETS = Object.freeze([
  {
    id: 'image-square',
    label: 'Square social or product image',
    ratio: '1:1',
    imageSize: '2K',
    hint: 'Avatars, product shots, and feed posts.',
  },
  {
    id: 'image-portrait',
    label: 'Portrait poster or portrait',
    ratio: '3:4',
    imageSize: '2K',
    hint: 'People, posters, and book covers.',
  },
  {
    id: 'image-landscape',
    label: 'Landscape cover or scene',
    ratio: '16:9',
    imageSize: '2K',
    hint: 'Scenes, banners, and video covers.',
  },
  {
    id: 'image-phone',
    label: 'Phone wallpaper or vertical story',
    ratio: '9:16',
    imageSize: '2K',
    hint: 'Phone wallpapers, stories, and short-form covers.',
  },
]);

const VIDEO_PRESETS = Object.freeze([
  {
    id: 'video-vertical',
    label: 'Vertical short video',
    aspectRatio: '9:16',
    seconds: '5',
    resolution: '720P',
    hint: 'Douyin, Reels, Stories, and phone-first clips.',
  },
  {
    id: 'video-landscape',
    label: 'Landscape promo or cinematic shot',
    aspectRatio: '16:9',
    seconds: '5',
    resolution: '1080P',
    hint: 'YouTube, Bilibili, trailers, and landscape scenes.',
  },
  {
    id: 'video-square',
    label: 'Square product or social video',
    aspectRatio: '1:1',
    seconds: '5',
    resolution: '720P',
    hint: 'Product ads and square social feeds.',
  },
]);

// Command, format, usage, and style words do not tell us what the picture is
// about. They are removed before deciding whether a brief has a real subject.
const CJK_GENERIC = /(请|帮我|帮忙|给我|我要|我想|想要|需要|麻烦|生成|制作|设计|创作|绘制|编辑|修改|处理|优化|调整|修|美化|润色|抠|画|做|搞|来|出|一张|一幅|一个|一段|一条|一部|一集|一期|一场|一幕|一只|一台|一朵|一件|一套|一份|这|那|此|把|张|幅|个|段|条|部|集|期|场|幕|戏|只|台|朵|件|套|份|种|些|点|图片|图像|照片|图|配图|背景图|视频|短片|动画|作品|内容|一下|吧|呗|谢谢|可以|能不能|能|用|的|风格|效果|感觉|氛围|很|非常|特别|十分|比较|挺|太|极其|真的|先|再|然后|一点|一些|稍微|尽量|最好|发|你|您|东西|主义|国风|高级|人像|好看|漂亮|精美|高质量|高清|超清|唯美|高级感|电影感|真实感|写实|抽象|极简|复古|未来感|科幻|赛博朋克|卡通|漫画|插画|油画|水彩|素描|摄影|手机|电脑|桌面|屏幕|平板|竖屏|横屏|竖版|横版|抖音|快手|短视频|壁纸|头像|海报|封面|宣传片|影片|电影|片子|片|水墨|国画|版画|logo|图标|随便|任意|任何|什么都行|你决定|看着办|默认|参数|适合|用于|使用|用途|宣传|广告|营销|电商|产品|商品|社交|朋友圈|平台|展示)/g;

const EN_GENERIC = /\b(please|help|me|my|i|want|need|would|like|to|generate|create|make|draw|render|produce|design|give|show|an?|the|some|something|anything|whatever|image|images|picture|pictures|photo|photos|pic|pics|video|videos|clip|clips|animation|of|for|with|in|on|at|and|nice|beautiful|pretty|good|great|high[- ]quality|hd|4k|8k|ultra|realistic|cinematic|style|effect|feel|aesthetic|cyberpunk|cartoon|comic|illustration|painting|watercolor|sketch|photography|poster|avatar|wallpaper|thumbnail|banner|cover|logo|icon|portrait|product|shot|shots|ad|ads|ps|social|media|post|feed|cool|awesome|amazing|you|your|want|wish|prefer|phone|mobile|iphone|android|desktop|computer|screen|display|film|films|movie|movies|short|promo|episode|episodes|scene|scenes|default|whatever|you decide|your call)\b/g;

function cleanPrompt(value) {
  return typeof value === 'string' ? value.trim().slice(0, 8_000) : '';
}

function hasConcreteSubject(prompt) {
  const normalized = prompt
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (normalized === '') return false;
  const stripped = normalized
    .replace(CJK_GENERIC, ' ')
    .replace(EN_GENERIC, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped === '') return false;
  if (/[\u3400-\u9fff]/u.test(stripped)) return true;
  return stripped.split(/\s+/).some((token) => /[a-z]{2,}/i.test(token));
}

function recommendedImagePreset(prompt) {
  const text = prompt.toLowerCase();
  if (/(手机|壁纸|竖屏|story|phone|wallpaper|reels|tiktok)/i.test(text)) return 'image-phone';
  if (/(横版|横屏|封面|banner|cover|landscape|场景|scene)/i.test(text)) return 'image-landscape';
  if (/(海报|人像|写真|portrait|poster)/i.test(text)) return 'image-portrait';
  if (/(方形|头像|产品|商品|电商|product|avatar|logo|icon|square)/i.test(text)) return 'image-square';
  return 'image-square';
}

function recommendedVideoPreset(prompt) {
  const text = prompt.toLowerCase();
  if (/(竖屏|竖版|抖音|快手|短视频|reels|tiktok|story|phone)/i.test(text)) return 'video-vertical';
  if (/(方形|方图|产品|商品|广告|电商|product|square|ad)/i.test(text)) return 'video-square';
  if (/(横屏|横版|宣传|电影|youtube|bilibili|b站|landscape|trailer)/i.test(text)) return 'video-landscape';
  return 'video-landscape';
}

function hasReference(input, kind) {
  const hasImages = Array.isArray(input.images) && input.images.some((value) => typeof value === 'string' && value.trim() !== '');
  if (kind === 'image') return hasImages;
  const hasText = (value) => typeof value === 'string' && value.trim() !== '';
  return hasImages
    || hasText(input.firstFrame)
    || hasText(input.lastFrame)
    || (Array.isArray(input.audios) && input.audios.some(hasText))
    || (Array.isArray(input.videos) && input.videos.some((item) => hasText(item?.url)));
}

function buildClarification(kind, prompt, editing = false) {
  const isImage = kind === 'image';
  const presets = isImage ? IMAGE_PRESETS : VIDEO_PRESETS;
  const recommended = isImage ? recommendedImagePreset(prompt) : recommendedVideoPreset(prompt);
  return {
    action: 'clarification',
    kind,
    status: 'needs_input',
    prompt,
    missing: [editing ? 'instruction' : 'subject'],
    question: editing
      ? (isImage ? 'How should the image be edited?' : 'What should happen in the video?')
      : (isImage
        ? 'What should the image show, and where will it be used?'
        : 'What should the video show, and how long or which orientation do you need?'),
    recommended,
    presets: presets.map((preset) => ({ ...preset })),
  };
}

/**
 * Returns a clarification object when an image/video brief has no concrete
 * subject. A clear subject in a short request is allowed; visual defaults are
 * applied by the generator and can be mentioned to the user afterwards.
 */
export function assessGenerationBrief(kind, input = {}) {
  if (kind !== 'image' && kind !== 'video') return null;
  const prompt = cleanPrompt(input.prompt);
  const editing = hasReference(input, kind);
  if (prompt === '') return buildClarification(kind, prompt, editing);
  if (hasConcreteSubject(prompt)) return null;
  return buildClarification(kind, prompt, editing);
}

export { IMAGE_PRESETS, VIDEO_PRESETS };
