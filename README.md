# Agnes Studio for DSH

A persistent DeepSeekRuntime web plugin for the [Agnes AI API](https://www.agnes-ai.cn/zh-Hans/docs/overview).

- One `agnes_studio` tool for text, image, and video generation.
- Rich in-chat previews for generated images, videos, and text.
- A persistent **Agnes works** page in the left sidebar for browsing, downloading, and deleting generated media.
- **Settings → Agnes Studio** contains only the model connection and text/image/video model mapping, using DSH's official **Settings → Models** custom-provider configuration.
- Text, image, and video generation share one API key. The key is stored as a DSH credential and never enters the browser bundle or generated client code.
- Generated media is downloaded into the active DSH profile's `agnes-studio/` directory and served through a same-origin Host route without exposing filesystem paths.

## Configuration

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

## Usage in chat

Ask naturally, for example:

- “生成一张 16:9 的雨夜未来城市海报。”
- “生成一段 5 秒的视频：雨后霓虹街道，银色跑车驶过。”
- “用 Agnes 写一段产品发布会开场文案。”
- “看看我之前生成的图片。”

The plugin adds model-facing guidance so image and video requests invoke `agnes_studio` automatically, without opening Settings or naming the tool. Ordinary conversation stays with the assistant; the Agnes text action is used only when you explicitly ask for an Agnes text completion. Results render directly in the conversation and are saved to the **Agnes works** page, opened from the left sidebar.

## Storage

History and media live under `$DSH_PROFILE_DIR/agnes-studio/` when the Host exposes that variable, otherwise `~/.dsh/agnes-studio/`. The history file is capped at the newest 500 records.
