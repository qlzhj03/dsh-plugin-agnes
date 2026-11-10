# Agnes Studio for DSH

简体中文（默认） · [English](#english)

面向 [Agnes AI API](https://www.agnes-ai.cn/zh-Hans/docs/overview) 的 DSH（DeepSeekRuntime）Web 持久化插件。

- 只提供一个 `agnes_studio` 工具，统一完成文本、图片与视频生成。
- 生成结果（图片、视频、文本）直接在对话中渲染预览。
- 左侧边栏提供常驻的 **Agnes 创作台** 页面，可浏览、下载和删除已生成的媒体。
- **设置 → Agnes Studio** 只包含模型连接与文本/图片/视频模型映射，复用 DSH 官方 **设置 → 模型** 的自定义供应商配置。
- 文本、图片、视频共用同一个 API Key。密钥保存为 DSH 凭据，不会进入浏览器 bundle 或生成的客户端代码。
- 生成的媒体会下载到当前 DSH profile 的 `agnes-studio/` 目录，并通过同源 Host 路由访问，不暴露文件系统路径。

## 配置

首次使用时打开 **设置 → Agnes Studio**。如果尚无 Agnes 供应商，点击 **创建 Agnes 供应商**。该操作会在 DSH 的 **设置 → 模型** 页面创建一个名为 `agnes` 的自定义模型供应商：

| 字段 | 值 |
| --- | --- |
| Base URL | `https://api.agnes-ai.cn/v1` |
| API 协议 | OpenAI Chat Completions |
| 凭据引用 | `AGNES_API_KEY` |
| 模型 | `agnes-2.5-flash` |

供应商目录只登记文本模型，这样 DSH 的模型选择器中会出现可用的对话模型；图片与视频模型 ID 则保留在下面的 Agnes Studio 模型映射中。

然后打开 **设置 → 模型 → Agnes**，粘贴 Agnes 平台控制台中的 API Key。文本、图片、视频共用这一把 Key，Agnes Studio 页面不单独提供 Key 输入框。若 Host 环境变量中存在 `AGNES_API_KEY` 且没有已保存的凭据，插件也会使用它。

**设置 → Agnes Studio** 中的模型映射默认值：

| 设置项 | 默认值 |
| --- | --- |
| 文本模型 | `agnes-2.5-flash` |
| 图片模型 | `agnes-image-2.5-flash` |
| 视频模型 | `agnes-video-2.5` |

切换所选供应商会同时改变三项能力使用的 Base URL 与凭据。API Key 与 Base URL 在插件页面中刻意保持只读。

## 在对话中使用

直接用自然语言描述即可，例如：

- “生成一张 16:9 的雨夜未来城市海报。”
- “生成一段 5 秒的视频：雨后霓虹街道，银色跑车驶过。”
- “用 Agnes 写一段产品发布会开场文案。”
- “看看我之前生成的图片。”

插件会向模型注入使用指引，图片与视频请求会自动调用 `agnes_studio`，无需打开设置或点名工具。普通对话仍交给助手处理；只有当你明确要求用 Agnes 做文本生成时，才会走 Agnes 文本能力。结果直接渲染在对话里，并保存到左侧边栏的 **Agnes 创作台** 页面。

## 存储

当 Host 暴露 `DSH_PROFILE_DIR` 时，历史与媒体位于 `$DSH_PROFILE_DIR/agnes-studio/`，否则位于 `~/.dsh/agnes-studio/`。历史记录文件最多保留最新 500 条。

---

## English

[简体中文](#agnes-studio-for-dsh) · English

A persistent DSH (DeepSeekRuntime) web plugin for the [Agnes AI API](https://www.agnes-ai.cn/zh-Hans/docs/overview).

- One `agnes_studio` tool for text, image, and video generation.
- Rich in-chat previews for generated images, videos, and text.
- A persistent **Agnes works** page in the left sidebar for browsing, downloading, and deleting generated media.
- **Settings → Agnes Studio** contains only the model connection and text/image/video model mapping, using DSH's official **Settings → Models** custom-provider configuration.
- Text, image, and video generation share one API key. The key is stored as a DSH credential and never enters the browser bundle or generated client code.
- Generated media is downloaded into the active DSH profile's `agnes-studio/` directory and served through a same-origin Host route without exposing filesystem paths.

### Configuration

On first use, open **Settings → Agnes Studio**. If no Agnes provider exists, click **Create Agnes provider**. This creates a custom model provider named `agnes` in DSH's **Settings → Models** page with:

| Field | Value |
| --- | --- |
| Base URL | `https://api.agnes-ai.cn/v1` |
| API protocol | OpenAI Chat Completions |
| Credential reference | `AGNES_API_KEY` |
| Model | `agnes-2.5-flash` |

The provider catalog lists only the text model so DSH's model picker shows a usable chat model. Image and video model IDs stay in Agnes Studio's model mapping below.

Then open **Settings → Models → Agnes** and paste the API key from the Agnes platform console. The same key is used for text, image, and video; there is no separate key field in the Agnes Studio page. The plugin also accepts `AGNES_API_KEY` from the Host environment when no stored credential exists.

The model mapping in **Settings → Agnes Studio** defaults to:

| Setting | Default |
| --- | --- |
| Text model | `agnes-2.5-flash` |
| Image model | `agnes-image-2.5-flash` |
| Video model | `agnes-video-2.5` |

Changing the selected provider changes the Base URL and credential used by all three capabilities. API keys and Base URLs are intentionally read-only in the plugin page.

### Usage in chat

Ask naturally, for example:

- “生成一张 16:9 的雨夜未来城市海报。”
- “生成一段 5 秒的视频：雨后霓虹街道，银色跑车驶过。”
- “用 Agnes 写一段产品发布会开场文案。”
- “看看我之前生成的图片。”

The plugin adds model-facing guidance so image and video requests invoke `agnes_studio` automatically, without opening Settings or naming the tool. Ordinary conversation stays with the assistant; the Agnes text action is used only when you explicitly ask for an Agnes text completion. Results render directly in the conversation and are saved to the **Agnes works** page, opened from the left sidebar.

### Storage

History and media live under `$DSH_PROFILE_DIR/agnes-studio/` when the Host exposes that variable, otherwise `~/.dsh/agnes-studio/`. The history file is capped at the newest 500 records.
