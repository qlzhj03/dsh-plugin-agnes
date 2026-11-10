window.__ModuleLoader__.load({
  id: '@local/dsh-agnes-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'agnesStudio';
    const API = '/api/agnes-studio';
    const PANEL_ID = 'agnes-studio';

    const DICTS = {
      en: {
        'section.title': 'Agnes Studio',
        'section.subtitle': 'Generate directly in chat. Configure the shared Agnes model connection here; text, image, and video use the same DSH-managed API key.',
        'section.ready': 'DSH model connected',
        'section.missing': 'Setup needed',
        'gallery.title': 'Agnes works',
        'gallery.subtitle': 'Images, videos, and text generated in chat are saved here automatically.',
        'gallery.backToChat': 'Back to chat',
        'tabs.create': 'Create',
        'tabs.history': 'History',
        'tabs.settings': 'Settings',
        'common.refresh': 'Refresh',
        'common.save': 'Save',
        'common.saving': 'Saving…',
        'common.delete': 'Delete',
        'common.download': 'Download',
        'common.loading': 'Loading…',
        'common.retry': 'Retry',
        'common.optional': 'optional',
        'common.close': 'Close',
        'create.text': 'Text',
        'create.image': 'Image',
        'create.video': 'Video',
        'create.prompt': 'Prompt',
        'create.promptPlaceholder': 'Describe what you want to create in detail…',
        'create.system': 'System instruction',
        'create.systemPlaceholder': 'Optional role or style guidance for text generation.',
        'create.imageSize': 'Image size',
        'create.ratio': 'Aspect ratio',
        'create.referenceUrls': 'Reference image URLs',
        'create.referenceHint': 'One public image URL or data URI per line. Up to 8. Use for editing or composition.',
        'create.videoMode': 'Mode',
        'create.seconds': 'Duration',
        'create.resolution': 'Resolution',
        'create.aspect': 'Aspect ratio',
        'create.firstFrame': 'First frame URL',
        'create.lastFrame': 'Last frame URL',
        'create.generate': 'Generate',
        'create.generatingText': 'Generating text…',
        'create.generatingImage': 'Generating image…',
        'create.generatingVideo': 'Generating video… this can take a few minutes',
        'create.needKey': 'Connect Agnes through DSH Models before generating.',
        'create.openSettings': 'Open setup',
        'create.result': 'Latest result',
        'create.saved': 'Saved to Agnes history',
        'create.failed': 'Generation failed',
        'create.noPrompt': 'Enter a prompt first.',
        'mode.text': 'Text to video',
        'mode.keyframe': 'Keyframes',
        'mode.reference': 'References',
        'history.title': 'Generated works',
        'history.all': 'All',
        'history.empty': 'No works yet. Ask in chat to generate an image or video.',
        'history.emptyFilter': 'No results match this filter.',
        'history.searchPlaceholder': 'Search prompts and text…',
        'history.failed': 'Failed',
        'history.confirmDelete': 'Delete this item and its local media file?',
        'history.deleted': 'Deleted',
        'setup.title': 'Connect Agnes',
        'setup.body': 'Agnes uses a DSH custom model provider for its API key. Create the provider once; text, image, and video share the same key.',
        'setup.create': 'Create Agnes provider',
        'setup.creating': 'Creating…',
        'setup.created': 'Agnes provider created. Add its API key in DSH Settings → Models.',
        'setup.exists': 'An Agnes provider already exists in DSH Models.',
        'setup.providerMissing': 'No Agnes provider is connected yet.',
        'setup.keyMissing': 'The Agnes provider exists, but its API key is missing.',
        'setup.keyReady': 'Connected through DSH Models.',
        'setup.unavailable': 'DSH model settings are unavailable in this profile.',
        'setup.readonly': 'DSH model settings are read-only in this profile.',
        'setup.openModels': 'Open DSH Settings → Models, select this provider, and add its API Key:',
        'setup.refresh': 'Refresh status',
        'settings.title': 'DSH model connection',
        'settings.connection': 'DSH model provider',
        'settings.provider': 'Provider',
        'settings.providerHint': 'The provider owns the Base URL and the API key credential.',
        'settings.baseUrl': 'Base URL',
        'settings.providerId': 'Provider ID',
        'settings.apiKeyRef': 'Credential reference',
        'settings.keyManaged': 'The API key is managed by DSH Models and is never returned to this page.',
        'settings.models': 'Model mapping',
        'settings.modelHint': 'These model IDs are sent to the provider Base URL.',
        'settings.textModel': 'Text model',
        'settings.imageModel': 'Image model',
        'settings.videoModel': 'Video model',
        'settings.storage': 'History storage',
        'settings.docs': 'Agnes API documentation',
        'settings.saved': 'Settings saved.',
        'settings.advanced': 'Text, image, and video all use the same provider API key.',
        'tool.generating': 'Calling Agnes…',
        'tool.image': 'Agnes image',
        'tool.video': 'Agnes video',
        'tool.text': 'Agnes text',
        'tool.history': 'Agnes history',
        'tool.prompt': 'Prompt',
        'tool.model': 'Model',
        'tool.saved': 'Saved to Agnes history',
        'tool.failed': 'The Agnes call failed',
        'tool.empty': 'No saved Agnes generations yet.',
        'tool.mediaWarning': 'The remote URL works, but the local media copy could not be saved.',
      },
      zh: {
        'section.title': 'Agnes 创作台',
        'section.subtitle': '生成直接在对话中提出；这里只配置文本、图片和视频共用的 Agnes 模型连接。',
        'section.ready': 'DSH 模型已连接',
        'section.missing': '需要完成配置',
        'gallery.title': 'Agnes 作品',
        'gallery.subtitle': '在对话中生成的图片、视频和文本会自动保存在这里。',
        'gallery.backToChat': '返回对话',
        'tabs.create': '创作',
        'tabs.history': '历史',
        'tabs.settings': '设置',
        'common.refresh': '刷新',
        'common.save': '保存',
        'common.saving': '保存中…',
        'common.delete': '删除',
        'common.download': '下载',
        'common.loading': '加载中…',
        'common.retry': '重试',
        'common.optional': '可选',
        'common.close': '关闭',
        'create.text': '文本',
        'create.image': '图片',
        'create.video': '视频',
        'create.prompt': '提示词',
        'create.promptPlaceholder': '详细描述你想创作的内容…',
        'create.system': '系统指令',
        'create.systemPlaceholder': '可选的文本角色、语气或风格要求。',
        'create.imageSize': '图片尺寸档位',
        'create.ratio': '宽高比',
        'create.referenceUrls': '参考图片 URL',
        'create.referenceHint': '每行一个可公开访问的图片 URL 或 Data URI，最多 8 张，用于改图或多图合成。',
        'create.videoMode': '生成模式',
        'create.seconds': '时长',
        'create.resolution': '分辨率',
        'create.aspect': '画幅',
        'create.firstFrame': '首帧 URL',
        'create.lastFrame': '尾帧 URL',
        'create.generate': '开始生成',
        'create.generatingText': '正在生成文本…',
        'create.generatingImage': '正在生成图片…',
        'create.generatingVideo': '正在生成视频… 可能需要几分钟',
        'create.needKey': '请先通过 DSH 模型设置连接 Agnes。',
        'create.openSettings': '打开配置',
        'create.result': '最新结果',
        'create.saved': '已保存到 Agnes 历史',
        'create.failed': '生成失败',
        'create.noPrompt': '请先填写提示词。',
        'mode.text': '文生视频',
        'mode.keyframe': '首尾帧',
        'mode.reference': '多模态参考',
        'history.title': '历史作品',
        'history.all': '全部',
        'history.empty': '还没有作品。直接在对话中让助手生成图片或视频即可。',
        'history.emptyFilter': '当前筛选下没有结果。',
        'history.searchPlaceholder': '搜索提示词和文本…',
        'history.failed': '失败',
        'history.confirmDelete': '确定删除这条记录及其本地媒体文件吗？',
        'history.deleted': '已删除',
        'setup.title': '连接 Agnes',
        'setup.body': 'Agnes 使用 DSH 的自定义模型提供商保存 API Key。创建一次后，文本、图片和视频共用同一个 Key。',
        'setup.create': '创建 Agnes 提供商',
        'setup.creating': '正在创建…',
        'setup.created': 'Agnes 提供商已创建，请在 DSH 设置 → 模型中填写 API Key。',
        'setup.exists': 'DSH 模型中已有 Agnes 提供商。',
        'setup.providerMissing': '尚未连接 Agnes 提供商。',
        'setup.keyMissing': 'Agnes 提供商已存在，但尚未填写 API Key。',
        'setup.keyReady': '已通过 DSH 模型连接。',
        'setup.unavailable': '当前 profile 无法访问 DSH 模型设置。',
        'setup.readonly': '当前 profile 的 DSH 模型设置只读。',
        'setup.openModels': '打开 DSH 设置 → 模型，选择该提供商并填写 API Key：',
        'setup.refresh': '刷新状态',
        'settings.title': 'DSH 模型连接',
        'settings.connection': 'DSH 模型提供商',
        'settings.provider': '提供商',
        'settings.providerHint': 'Base URL 和 API Key 凭证都归属该提供商。',
        'settings.baseUrl': 'Base URL',
        'settings.providerId': '提供商 ID',
        'settings.apiKeyRef': '凭证引用',
        'settings.keyManaged': 'API Key 由 DSH 模型设置管理，不会回传到当前页面。',
        'settings.models': '模型映射',
        'settings.modelHint': '这些模型 ID 会发送到提供商的 Base URL。',
        'settings.textModel': '文本模型',
        'settings.imageModel': '图片模型',
        'settings.videoModel': '视频模型',
        'settings.storage': '历史存储位置',
        'settings.docs': 'Agnes API 文档',
        'settings.saved': '设置已保存。',
        'settings.advanced': '文本、图片和视频共用同一个提供商 API Key。',
        'tool.generating': '正在调用 Agnes…',
        'tool.image': 'Agnes 图片',
        'tool.video': 'Agnes 视频',
        'tool.text': 'Agnes 文本',
        'tool.history': 'Agnes 历史',
        'tool.prompt': '提示词',
        'tool.model': '模型',
        'tool.saved': '已保存到 Agnes 历史',
        'tool.failed': 'Agnes 调用失败',
        'tool.empty': '还没有保存过 Agnes 作品。',
        'tool.mediaWarning': '远程 URL 仍可使用，但本地媒体副本保存失败。',
      },
    };

    const STYLES = `
.as-root,.as-root *{box-sizing:border-box}
.as-root{color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.as-section{display:flex;flex-direction:column;gap:16px;width:100%;max-width:980px}
.as-page{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base)}
.as-page-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable}
.as-page-content{max-width:1120px;margin:0 auto;padding:0 clamp(24px,4vw,48px) 48px}
.as-page-heading{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:24px;padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}
.as-page-heading .as-logo{width:44px;height:44px}
.as-page-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
.as-page-title{margin:0;font-size:20px;font-weight:500;line-height:28px}
.as-page-subtitle{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:21px}
.as-header{display:flex;align-items:flex-start;gap:12px;min-width:0}
.as-logo{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}
.as-heading{flex:1;min-width:0}
.as-title{margin:0;font-size:18px;font-weight:600;line-height:26px}
.as-subtitle{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.as-status{display:inline-flex;align-items:center;gap:6px;flex:none;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:3px 9px;color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap}
.as-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:none}
.as-dot.ok{background:var(--dsw-alias-state-success-primary)}
.as-tabs{display:flex;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:6px;overflow:auto}
.as-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;padding:7px 12px;border-radius:8px;white-space:nowrap}
.as-tab:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.as-tab[aria-selected=true]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.as-tab:focus-visible,.as-btn:focus-visible,.as-input:focus-visible,.as-textarea:focus-visible,.as-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.as-card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:14px;padding:16px;min-width:0}
.as-card-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;min-width:0}
.as-card-title{font-size:14px;font-weight:600;flex:1;min-width:0}
.as-banner{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 35%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 7%,transparent);border-radius:10px;padding:9px 11px;color:var(--dsw-alias-label-primary);font-size:12px}
.as-banner .as-btn{margin-left:auto}
.as-segmented{display:flex;gap:4px;padding:3px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:10px;align-self:flex-start;flex-wrap:wrap}
.as-seg{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;padding:6px 12px;border-radius:7px;cursor:pointer}
.as-seg[aria-pressed=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-border-l1);font-weight:600}
.as-form{display:grid;gap:12px}
.as-field{display:grid;gap:5px;min-width:0}
.as-label{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600}
.as-label small{font-weight:400;color:var(--dsw-alias-label-secondary);opacity:.75}
.as-input,.as-textarea,.as-select{width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;padding:8px 10px;min-height:36px}
.as-input::placeholder,.as-textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.62}
.as-textarea{min-height:92px;resize:vertical;line-height:1.55}
.as-textarea.short{min-height:62px}
.as-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.as-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.as-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.as-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;border-radius:9px;padding:7px 12px;cursor:pointer;min-height:34px;text-decoration:none}
.as-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.as-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}
.as-btn.primary:hover{opacity:.9;background:var(--dsw-alias-brand-primary)}
.as-btn.danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,var(--dsw-alias-border-l1))}
.as-btn.small{min-height:28px;padding:4px 8px;font-size:11px}
.as-btn:disabled{opacity:.55;cursor:default}
.as-spinner{width:14px;height:14px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:as-spin .8s linear infinite;flex:none}
@keyframes as-spin{to{transform:rotate(360deg)}}
.as-note{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px}
.as-steps{display:grid;gap:7px;margin-top:9px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.as-code{display:block;padding:6px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;overflow-wrap:anywhere}
.as-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;white-space:pre-wrap}
.as-success{color:var(--dsw-alias-state-success-primary);font-size:12px}
.as-result{display:grid;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1)}
.as-media{display:block;max-width:100%;width:auto;max-height:360px;margin:0 auto;border-radius:10px;background:var(--dsw-alias-bg-layer-2);object-fit:contain}
.as-media.video{width:100%;max-height:420px;background:var(--dsw-alias-bg-base)}
.as-text-result{margin:0;max-height:360px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:12px;font:inherit;font-size:12px;line-height:1.7}
.as-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--dsw-alias-label-secondary);font-size:10px}
.as-chip{border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 7px;color:var(--dsw-alias-label-secondary);font-size:10px;white-space:nowrap}
.as-chip.failed{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,var(--dsw-alias-border-l1))}
.as-history-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.as-search{flex:1;min-width:180px}
.as-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.as-tile{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.as-tile-media{width:100%;height:190px;object-fit:contain;background:var(--dsw-alias-bg-layer-2);display:block}
.as-tile-text{padding:12px;min-height:140px;max-height:190px;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.65;background:var(--dsw-alias-bg-layer-2)}
.as-tile-body{display:flex;flex-direction:column;gap:6px;padding:10px 12px 12px;flex:1}
.as-tile-title{margin:0;font-size:12px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.as-tile-prompt{margin:0;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.as-tile-foot{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:4px;flex-wrap:wrap}
.as-empty{color:var(--dsw-alias-label-secondary);text-align:center;padding:28px 16px;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;font-size:12px}
.as-settings-grid{display:grid;gap:16px}
.as-settings-block{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px;display:grid;gap:10px;background:var(--dsw-alias-bg-base)}
.as-settings-title{font-size:13px;font-weight:600;margin:0}
.as-kv{display:grid;grid-template-columns:106px minmax(0,1fr);gap:6px 10px;font-size:11px}
.as-kv dt{color:var(--dsw-alias-label-secondary);margin:0}
.as-kv dd{margin:0;overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.as-link{color:var(--dsw-alias-brand-primary);text-decoration:none}
.as-link:hover{text-decoration:underline}
.as-tool{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px;display:grid;gap:10px;max-width:720px;min-width:0}
.as-tool-head{display:flex;align-items:center;gap:8px;min-width:0}
.as-tool-title{font-size:12px;font-weight:600;flex:1}
.as-tool-generating{display:flex;align-items:center;gap:9px;color:var(--dsw-alias-label-secondary);font-size:12px;padding:3px 0}
.as-tool-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12px;line-height:1.65;max-height:320px;overflow:auto;background:var(--dsw-alias-bg-layer-2);padding:10px;border-radius:9px}
.as-tool-history{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.as-tool-thumb{width:100%;height:96px;object-fit:cover;border-radius:8px;background:var(--dsw-alias-bg-layer-2);display:block}
.as-tool-text-thumb{height:96px;overflow:hidden;border-radius:8px;background:var(--dsw-alias-bg-layer-2);padding:8px;color:var(--dsw-alias-label-secondary);font-size:10px;line-height:1.4}
.as-tool-foot{display:flex;gap:8px;flex-wrap:wrap;color:var(--dsw-alias-label-secondary);font-size:10px;align-items:center}
.as-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
@media(max-width:620px){.as-grid,.as-grid.three{grid-template-columns:1fr}.as-gallery{grid-template-columns:1fr}.as-header{flex-wrap:wrap}.as-status{order:3}.as-tile-media{height:220px}.as-page-content{padding-inline:20px}.as-page-heading{gap:12px}.as-page-actions{width:100%;margin-left:0}}
@media(prefers-reduced-motion:reduce){.as-spinner{animation:none}}
`;

    function Style() {
      return h('style', { 'data-agnes-studio': true }, STYLES);
    }

    function Logo({ size = 28 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 64 64',
        'aria-hidden': true,
        style: { display: 'block' },
      },
      h('defs', null,
        h('linearGradient', { id: 'as-g', x1: '10', y1: '54', x2: '54', y2: '10', gradientUnits: 'userSpaceOnUse' },
          h('stop', { stopColor: '#3B5BFF' }),
          h('stop', { offset: '0.55', stopColor: '#8B5CF6' }),
          h('stop', { offset: '1', stopColor: '#FF7A59' }))),
      h('rect', { x: 3, y: 3, width: 58, height: 58, rx: 16, fill: '#101322' }),
      h('path', { d: 'M32 10 52 39 32 54 12 39 32 10Z', fill: 'url(#as-g)' }),
      h('path', { d: 'M32 20 42 36 32 45 22 36 32 20Z', fill: '#101322', opacity: '0.5' }),
      h('circle', { cx: 48, cy: 16, r: 4, fill: '#FFD166' }),
      h('path', { d: 'M48 7v4M48 21v4M39 16h4M53 16h4', stroke: '#FFD166', strokeWidth: 2, strokeLinecap: 'round' }));
    }

    function PanelIcon({ size = 18 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        'aria-hidden': true,
        style: { display: 'block' },
      },
      h('rect', { x: 3.25, y: 4.75, width: 17.5, height: 14.5, rx: 3, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('path', { d: 'M4.5 16.2l4-3.8a2 2 0 0 1 2.7 0l2.2 2.1 1.7-1.5a2 2 0 0 1 2.7 0l2.7 2.4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      h('path', { d: 'M18.2 2.6l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z', fill: 'currentColor' }));
    }

    function useT(ctx) {
      const subscribe = React.useCallback((onChange) => ctx.locale.subscribe(onChange), [ctx]);
      const snapshot = React.useSyncExternalStore(subscribe, () => ctx.locale.getSnapshot(), () => ctx.locale.getSnapshot());
      const bind = React.useMemo(() => ctx.locale.bind(NS), [ctx]);
      return {
        t: bind,
        locale: typeof snapshot?.active === 'string' ? snapshot.active : 'en',
      };
    }

    function formatDate(value, locale) {
      const date = value ? new Date(value) : null;
      if (date === null || Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    function humanBytes(value) {
      if (!Number.isFinite(value) || value <= 0) return '';
      if (value < 1024) return `${value} B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
      return `${(value / 1024 / 1024).toFixed(1)} MB`;
    }

    async function api(path, options = {}) {
      const headers = { ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...(options.headers || {}) };
      const response = await fetch(`${API}${path}`, { ...options, headers });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
      return data;
    }

    function ErrorText({ children }) {
      if (!children) return null;
      return h('div', { className: 'as-error', role: 'alert' }, children);
    }

    function Spinner() {
      return h('span', { className: 'as-spinner', 'aria-hidden': true });
    }

    function Button({ children, primary, danger, small, disabled, onClick, type = 'button', title }) {
      return h('button', {
        type,
        className: `as-btn${primary ? ' primary' : ''}${danger ? ' danger' : ''}${small ? ' small' : ''}`,
        disabled,
        onClick,
        title,
      }, children);
    }

    function Field({ label, hint, children }) {
      return h('label', { className: 'as-field' },
        h('span', { className: 'as-label' }, label, hint ? h('small', null, ` · ${hint}`) : null),
        children);
    }

    function MediaView({ record, tool = false }) {
      const src = record.mediaUrl || record.remoteUrl;
      if (record.kind === 'video' && src) {
        return h('video', {
          className: `as-media${tool ? '' : ' video'}`,
          src,
          controls: true,
          preload: 'metadata',
          playsInline: true,
        });
      }
      if (record.kind === 'image' && src) {
        return h('img', { className: 'as-media', src, alt: record.title || record.prompt || 'Agnes image', loading: 'lazy' });
      }
      if (record.kind === 'text' || record.text) {
        return h('pre', { className: 'as-text-result' }, record.text || '');
      }
      return null;
    }

    function RecordMeta({ record, t, locale }) {
      return h('div', { className: 'as-meta' },
        h('span', { className: 'as-chip' }, record.kind),
        record.status === 'failed' ? h('span', { className: 'as-chip failed' }, t('history.failed')) : null,
        record.model ? h('span', null, record.model) : null,
        record.createdAt ? h('span', null, formatDate(record.createdAt, locale)) : null,
        record.media?.bytes ? h('span', null, humanBytes(record.media.bytes)) : null);
    }

    function RecordCard({ record, t, locale, onDelete }) {
      const src = record.mediaUrl || record.remoteUrl;
      const title = record.title || record.prompt || record.id;
      const preview = record.kind === 'text'
        ? h('div', { className: 'as-tile-text' }, record.text || record.prompt || '')
        : record.kind === 'video' && src
          ? h('video', { className: 'as-tile-media', src, controls: true, preload: 'metadata', playsInline: true })
          : record.kind === 'image' && src
            ? h('img', { className: 'as-tile-media', src, alt: title, loading: 'lazy' })
            : h('div', { className: 'as-tile-text' }, record.status === 'failed' ? record.error || t('history.failed') : '');
      return h('article', { className: 'as-tile' },
        preview,
        h('div', { className: 'as-tile-body' },
          h('h3', { className: 'as-tile-title', title }, title),
          record.status === 'failed' && record.error ? h('p', { className: 'as-tile-prompt as-error' }, record.error) : null,
          h('div', { className: 'as-tile-foot' },
            h(RecordMeta, { record, t, locale }),
            src ? h('a', { className: 'as-btn small', href: src, download: record.media?.fileName || '', target: '_blank', rel: 'noreferrer' }, t('common.download')) : null,
            h(Button, { small: true, danger: true, onClick: () => onDelete(record.id), title: t('common.delete') }, t('common.delete')))));
    }

    function ToolView(props) {
      const { t, locale } = useT(props.__ctx);
      const block = props.block;
      if (props.phase !== 'result') {
        let action = '';
        try {
          action = JSON.parse(block?.argsRaw || '{}').action || '';
        } catch {
          action = '';
        }
        return h('div', { className: 'as-root' },
          h(Style),
          h('div', { className: 'as-tool' },
            h('div', { className: 'as-tool-head' }, h(Logo, { size: 20 }), h('span', { className: 'as-tool-title' }, action === 'image' ? t('tool.image') : action === 'video' ? t('tool.video') : action === 'text' ? t('tool.text') : 'Agnes Studio')),
            h('div', { className: 'as-tool-generating' }, h(Spinner), t('tool.generating'))));
      }
      if (block.isError) {
        const message = Array.isArray(block.content)
          ? block.content.map((part) => part?.text || '').filter(Boolean).join('\n')
          : '';
        const setupNeeded = /Agnes API key is not configured|Agnes provider|DSH model settings/i.test(message || '');
        return h('div', { className: 'as-root' }, h(Style), h('div', { className: 'as-tool' },
          h('div', { className: 'as-tool-head' }, h(Logo, { size: 20 }), h('span', { className: 'as-tool-title' }, t('tool.failed'))),
          h(ErrorText, null, message || block.error?.reason || block.error?.code || t('tool.failed')),
          setupNeeded ? h('div', { className: 'as-steps' },
            h('div', null, t('setup.body')),
            h('div', null, t('setup.openModels')),
            h('code', { className: 'as-code' }, 'agnes → AGNES_API_KEY')) : null));
      }
      const meta = block.meta;
      if (meta?.studio !== 'agnes') {
        const message = Array.isArray(block.content)
          ? block.content.map((part) => part?.text || '').filter(Boolean).join('\n')
          : '';
        return h('div', { className: 'as-root' }, h(Style), h('div', { className: 'as-tool' }, h('pre', { className: 'as-tool-text' }, message)));
      }
      if (meta.action === 'history') {
        return h('div', { className: 'as-root' }, h(Style), h('div', { className: 'as-tool' },
          h('div', { className: 'as-tool-head' }, h(Logo, { size: 20 }), h('span', { className: 'as-tool-title' }, t('tool.history')), h('span', { className: 'as-chip' }, String(meta.total || 0))),
          (meta.items || []).length === 0
            ? h('div', { className: 'as-note' }, t('tool.empty'))
            : h('div', { className: 'as-tool-history' }, (meta.items || []).slice(0, 8).map((record) => {
              const src = record.mediaUrl || record.remoteUrl;
              if (record.kind === 'image' && src) return h('img', { key: record.id, className: 'as-tool-thumb', src, alt: record.title || '', loading: 'lazy' });
              if (record.kind === 'video' && src) return h('video', { key: record.id, className: 'as-tool-thumb', src, muted: true, preload: 'metadata', playsInline: true });
              return h('div', { key: record.id, className: 'as-tool-text-thumb' }, record.title || record.text || record.prompt || '');
            })),
          h('div', { className: 'as-tool-foot' }, h('span', null, `${meta.items?.length || 0} / ${meta.total || 0}`))));
      }
      const record = meta.record || {};
      return h('div', { className: 'as-root' }, h(Style), h('div', { className: 'as-tool' },
        h('div', { className: 'as-tool-head' },
          h(Logo, { size: 20 }),
          h('span', { className: 'as-tool-title' }, record.kind === 'image' ? t('tool.image') : record.kind === 'video' ? t('tool.video') : t('tool.text')),
          h('span', { className: 'as-chip' }, record.status || 'completed')), 
        h(MediaView, { record, tool: true }),
        record.prompt ? h('div', null, h('div', { className: 'as-label' }, t('tool.prompt')), h('div', { className: 'as-note' }, record.prompt)) : null,
        record.mediaError ? h('div', { className: 'as-note' }, t('tool.mediaWarning')) : null,
        h('div', { className: 'as-tool-foot' },
          record.model ? h('span', null, `${t('tool.model')}: ${record.model}`) : null,
          record.createdAt ? h('span', null, formatDate(record.createdAt, locale)) : null,
          h('span', null, t('tool.saved')))));
    }

    function HistoryPanel({ t, locale, refreshToken, onDeleted }) {
      const [filter, setFilter] = React.useState('all');
      const [query, setQuery] = React.useState('');
      const [data, setData] = React.useState({ items: [], total: 0, counts: {} });
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState('');

      const load = React.useCallback(async (nextFilter = filter, nextQuery = query) => {
        setLoading(true);
        setError('');
        try {
          const params = new URLSearchParams({ limit: '100' });
          if (nextFilter !== 'all') params.set('kind', nextFilter);
          if (nextQuery.trim() !== '') params.set('q', nextQuery.trim());
          setData(await api(`/history?${params.toString()}`));
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure));
        } finally {
          setLoading(false);
        }
      }, [filter, query]);

      React.useEffect(() => { load(); }, [refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps

      const chooseFilter = (value) => {
        setFilter(value);
        load(value, query);
      };

      const remove = async (id) => {
        if (typeof window.confirm === 'function' && !window.confirm(t('history.confirmDelete'))) return;
        try {
          await api(`/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
          onDeleted();
          await load();
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure));
        }
      };

      return h('div', { className: 'as-card' },
        h('div', { className: 'as-history-toolbar' },
          h('div', { className: 'as-segmented' },
            [['all', t('history.all')], ['image', t('create.image')], ['video', t('create.video')], ['text', t('create.text')]].map(([value, label]) =>
              h('button', {
                key: value,
                type: 'button',
                className: 'as-seg',
                'aria-pressed': filter === value,
                onClick: () => chooseFilter(value),
              }, `${label}${data.counts?.[value] !== undefined ? ` ${data.counts[value]}` : ''}`))),
          h('input', {
            className: 'as-input as-search',
            value: query,
            placeholder: t('history.searchPlaceholder'),
            onChange: (event) => setQuery(event.target.value),
            onKeyDown: (event) => { if (event.key === 'Enter') load(filter, event.currentTarget.value); },
          }),
          h(Button, { small: true, disabled: loading, onClick: () => load() }, loading ? h(Spinner) : null, t('common.refresh'))),
        h(ErrorText, null, error),
        loading ? h('div', { className: 'as-empty' }, h(Spinner), ` ${t('common.loading')}`)
          : (data.items || []).length === 0
            ? h('div', { className: 'as-empty' }, query.trim() !== '' || filter !== 'all' ? t('history.emptyFilter') : t('history.empty'))
            : h('div', { className: 'as-gallery' }, data.items.map((record) => h(RecordCard, { key: record.id, record, t, locale, onDelete: remove }))));
    }

    function GalleryPage(props) {
      const { t, locale } = useT(props.__ctx);
      const [refreshToken, setRefreshToken] = React.useState(0);
      const layout = props.__ctx?.layout || (typeof props.__ctx?.get === 'function' ? props.__ctx.get('layout') : undefined);

      return h('div', { className: 'as-root as-page' },
        h(Style),
        h('div', { className: 'as-page-scroll' },
          h('div', { className: 'as-page-content' },
            h('header', { className: 'as-page-heading' },
              h('div', { className: 'as-logo' }, h(Logo, { size: 32 })),
              h('div', { className: 'as-heading' },
                h('h1', { className: 'as-page-title' }, t('gallery.title')),
                h('p', { className: 'as-page-subtitle' }, t('gallery.subtitle'))),
              layout ? h('div', { className: 'as-page-actions' },
                h(Button, { small: true, onClick: () => layout.selectPanel(null) }, t('gallery.backToChat'))) : null),
            h(HistoryPanel, {
              t,
              locale,
              refreshToken,
              onDeleted: () => setRefreshToken((value) => value + 1),
            }))));
    }

    function SettingsPanel({ t, config, onConfig, onSetup, setupBusy, setupError, setupNotice }) {
      const [providerId, setProviderId] = React.useState(config?.config?.providerId || '');
      const [textModel, setTextModel] = React.useState(config?.config?.textModel || '');
      const [imageModel, setImageModel] = React.useState(config?.config?.imageModel || '');
      const [videoModel, setVideoModel] = React.useState(config?.config?.videoModel || '');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');

      const connection = config?.connection || {};
      const selected = connection.provider || null;
      const providers = Array.isArray(connection.providers) ? connection.providers.filter((provider) => provider.agnes === true) : [];
      const reason = connection.reason;
      const canCreate = config?.setup?.canCreate === true;

      React.useEffect(() => {
        setProviderId(config?.config?.providerId || selected?.id || '');
        setTextModel(config?.config?.textModel || '');
        setImageModel(config?.config?.imageModel || '');
        setVideoModel(config?.config?.videoModel || '');
      }, [config, selected?.id]);

      const save = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
          const payload = { textModel, imageModel, videoModel };
          if (providerId !== '') payload.providerId = providerId;
          await api('/config', { method: 'POST', body: JSON.stringify(payload) });
          setNotice(t('settings.saved'));
          await onConfig();
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure));
        } finally {
          setBusy(false);
        }
      };

      const statusText = reason === 'ready'
        ? t('setup.keyReady')
        : reason === 'key-missing'
          ? t('setup.keyMissing')
          : reason === 'provider-missing'
            ? t('setup.providerMissing')
            : t('setup.unavailable');

      return h('div', { className: 'as-settings-grid' },
        h(ErrorText, null, error),
        h(ErrorText, null, setupError),
        notice ? h('div', { className: 'as-success' }, notice) : null,
        setupNotice ? h('div', { className: 'as-success' }, setupNotice) : null,
        h('div', { className: 'as-settings-block' },
          h('h3', { className: 'as-settings-title' }, t('settings.connection')),
          h('div', { className: 'as-banner', style: { background: 'transparent', borderColor: 'var(--dsw-alias-border-l1)' } },
            h('span', { className: `as-dot${config?.configured ? ' ok' : ''}` }),
            h('span', null, statusText)),
          reason === 'provider-missing' ? h('div', null,
            h('div', { className: 'as-note' }, t('setup.body')),
            canCreate ? h('div', { className: 'as-actions' },
              h(Button, { primary: true, disabled: setupBusy, onClick: onSetup },
                setupBusy ? h(Spinner) : null,
                setupBusy ? t('setup.creating') : t('setup.create'))) : h('div', { className: 'as-note' }, t('setup.readonly'))) : null,
          reason === 'key-missing' ? h('div', { className: 'as-steps' },
            h('div', null, t('setup.openModels')),
            h('code', { className: 'as-code' }, `${selected?.id || config?.config?.providerId || 'agnes'} → ${selected?.apiKeyEnv || 'API key'}`)) : null,
          reason === 'ready' ? h('div', { className: 'as-note' }, t('setup.keyReady')) : null,
          selected ? h('dl', { className: 'as-kv', style: { marginTop: 10 } },
            h('dt', null, t('settings.providerId')), h('dd', null, selected.id),
            h('dt', null, t('settings.baseUrl')), h('dd', null, selected.baseUrl || ''),
            h('dt', null, t('settings.apiKeyRef')), h('dd', null, selected.apiKeyEnv || '—')) : null,
          h('div', { className: 'as-note', style: { marginTop: 8 } }, t('settings.keyManaged')),
          h('div', { className: 'as-actions' },
            h(Button, { small: true, disabled: busy || setupBusy, onClick: onConfig }, t('setup.refresh')))),
        h('form', { className: 'as-settings-block', onSubmit: save },
          h('h3', { className: 'as-settings-title' }, t('settings.models')),
          providers.length > 0 ? h(Field, { label: t('settings.provider'), hint: t('settings.providerHint') },
            h('select', { className: 'as-select', value: providerId, onChange: (event) => setProviderId(event.target.value), disabled: busy },
              providers.map((provider) => h('option', { key: provider.id, value: provider.id }, `${provider.displayName || provider.id} · ${provider.id}`)))) : null,
          h('div', { className: 'as-grid' },
            h(Field, { label: t('settings.textModel') }, h('input', { className: 'as-input', value: textModel, onChange: (event) => setTextModel(event.target.value), disabled: busy })),
            h(Field, { label: t('settings.imageModel') }, h('input', { className: 'as-input', value: imageModel, onChange: (event) => setImageModel(event.target.value), disabled: busy })),
            h(Field, { label: t('settings.videoModel') }, h('input', { className: 'as-input', value: videoModel, onChange: (event) => setVideoModel(event.target.value), disabled: busy }))),
          h('div', { className: 'as-note' }, t('settings.modelHint'), ' ', t('settings.advanced')),
          h('div', { className: 'as-actions' }, h(Button, { type: 'submit', primary: true, disabled: busy }, busy ? h(Spinner) : null, busy ? t('common.saving') : t('common.save')))));
    }

    function StudioSection(props) {
      const { t } = useT(props.__ctx);
      const [config, setConfig] = React.useState(null);
      const [configError, setConfigError] = React.useState('');
      const [setupBusy, setSetupBusy] = React.useState(false);
      const [setupError, setSetupError] = React.useState('');
      const [setupNotice, setSetupNotice] = React.useState('');

      const loadConfig = React.useCallback(async () => {
        setConfigError('');
        try {
          const next = await api('/config');
          setConfig(next);
          return next;
        } catch (failure) {
          setConfigError(failure instanceof Error ? failure.message : String(failure));
          return null;
        }
      }, []);

      React.useEffect(() => { loadConfig(); }, [loadConfig]);

      const setup = async () => {
        if (setupBusy) return;
        setSetupBusy(true);
        setSetupError('');
        setSetupNotice('');
        try {
          const result = await api('/setup', { method: 'POST', body: '{}' });
          setConfig(result);
          setSetupNotice(result.created ? t('setup.created') : t('setup.exists'));
        } catch (failure) {
          setSetupError(failure instanceof Error ? failure.message : String(failure));
        } finally {
          setSetupBusy(false);
        }
      };

      return h('div', { className: 'as-root as-section' },
        h(Style),
        h('header', { className: 'as-header' },
          h('div', { className: 'as-logo' }, h(Logo, { size: 30 })),
          h('div', { className: 'as-heading' },
            h('h2', { className: 'as-title' }, t('section.title')),
            h('p', { className: 'as-subtitle' }, t('section.subtitle'))),
          h('span', { className: 'as-status' }, h('span', { className: `as-dot${config?.configured ? ' ok' : ''}` }), config?.configured ? t('section.ready') : t('section.missing'))),
        h(ErrorText, null, configError),
        config === null
          ? (configError ? null : h('div', { className: 'as-empty' }, h(Spinner), ` ${t('common.loading')}`))
          : h(SettingsPanel, {
            t,
            config,
            onConfig: loadConfig,
            onSetup: setup,
            setupBusy,
            setupError,
            setupNotice,
          }));
    }

    return {
      name: '@local/dsh-agnes-studio',
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICTS.zh), 'agnes-studio: zh dictionary');
        ctx.effect(() => ctx.locale.register(NS, 'en', DICTS.en), 'agnes-studio: en dictionary');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
          name: 'tool.call.toolview',
          key: 'agnes_studio',
        }, (props) => h(ToolView, { ...props, __ctx: ctx })));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, (props) => h(GalleryPage, { ...props, __ctx: ctx })));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 15,
          label: () => t('gallery.title'),
        }, PanelIcon));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: PANEL_ID,
          order: 30,
          label: () => t('section.title'),
        }, (props) => h(StudioSection, { ...props, __ctx: ctx })));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: PANEL_ID,
          order: 30,
        }, () => h(Logo, { size: 16 })));
      },
    };
  },
});
