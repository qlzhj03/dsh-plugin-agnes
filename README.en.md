# Agnes Studio for DSH

[简体中文](README.md) · English

A persistent DSH (DeepSeekRuntime) web plugin for the [Agnes AI API](https://www.agnes-ai.cn/zh-Hans/docs/overview).

- One `agnes_studio` tool for text, image, and video generation.
- Rich in-chat previews for generated images, videos, and text.
- A persistent **Agnes works** page in the left sidebar for browsing, downloading, and deleting generated media.
- Vague requests use the native question UI for the missing subject/usage while suggesting image ratios/detail or video duration/resolution; no extra card is shown and no subject is invented.
- **Settings → Agnes Studio** contains only the model connection and text/image/video model mapping, using DSH's official **Settings → Models** custom-provider configuration.
- Text, image, and video generation share one API key. The key is stored as a DSH credential and never enters the browser bundle or generated client code.
- Generated media is downloaded into the active DSH profile's `agnes-studio/` directory and served through a same-origin Host route without exposing filesystem paths.

## Installation

The plugin installs as a DSH profile bundle through the Web **Plugins** page or the `dsh plugin` command.

### From the Git repository (recommended)

1. Open **Plugins** in the DSH sidebar, then **Add plugin** → **Install a third-party plugin**.
2. Enter the repository address `git+https://github.com/qlzhj03/dsh-plugin-agnes.git` and choose **Install**.
3. Choose **Enable now** when installation finishes; restart DSH if prompted.
4. Open **Settings → Agnes Studio**, choose **Create Agnes provider**, then paste the API key under **Settings → Models → Agnes**.

Alternatively, run:

```bash
dsh plugin --profile web add git+https://github.com/qlzhj03/dsh-plugin-agnes.git
```

Then restart DSH.

### From a package tarball or local directory

For offline or intranet distribution, run this in the plugin directory:

```bash
pnpm pack
```

Send the generated `local-dsh-agnes-studio-1.0.0.tgz` to the other person, who selects it under **Plugins → Add plugin → Install a third-party plugin**, or enters its absolute path. Developers can also enter the plugin directory's absolute path to install it as a `link:` dependency.

## Configuration

On first use, open **Settings → Agnes Studio**. If no Agnes provider exists, click **Create Agnes provider**. This creates a custom model provider named `agnes` in DSH's **Settings → Models** page with:

| Field | Value |
| --- | --- |
| Base URL | `https://api.agnes-ai.cn/v1` |
| API protocol | OpenAI Chat Completions |
| Credential reference | `AGNES_API_KEY` |
| Model | `agnes-3.0-flash` |
| Context window | `512000` |
| Max output | `65536` |

The provider catalog lists only the text model so DSH's model picker shows a usable chat model. Image and video model IDs stay in Agnes Studio's model mapping below.

Then open **Settings → Models → Agnes** and paste the API key from the Agnes platform console. The same key is used for text, image, and video; there is no separate key field in the Agnes Studio page. The plugin also accepts `AGNES_API_KEY` from the Host environment when no stored credential exists.

The model mapping in **Settings → Agnes Studio** defaults to:

| Setting | Default |
| --- | --- |
| Text model | `agnes-3.0-flash` |
| Image model | `agnes-image-2.5-flash` |
| Video model | `agnes-video-2.5-flash` |

Model dropdowns are fetched live from the current provider's `/models` endpoint and grouped by model ID into text, image, and video. A configured value that is missing from the list is kept so saving never silently drops it. The provider itself is managed in DSH **Settings → Models**; the plugin page no longer offers a provider dropdown. API keys and Base URLs are intentionally read-only in the plugin page.

## Usage in chat

Ask naturally, for example:

- “生成一张 16:9 的雨夜未来城市海报。”
- “帮我画一张图。” or “做段视频。”: the plugin uses the native question UI for the subject/usage and suggests presets.
- “生成一段 5 秒的视频：雨后霓虹街道，银色跑车驶过。”
- “用 Agnes 写一段产品发布会开场文案。”
- “看看我之前生成的图片。”

The plugin adds model-facing guidance so image and video requests invoke `agnes_studio` automatically, without opening Settings or naming the tool. Ordinary conversation stays with the assistant; the Agnes text action is used only when you explicitly ask for an Agnes text completion. Results render directly in the conversation and are saved to the **Agnes works** page, opened from the left sidebar.

### Vague requests

When a request names only a format, style, or usage but no concrete subject (for example “draw an image”, “make a poster”, or “make a video”), the tool does not invent a subject and shows no extra card. It asks through the native question UI at the bottom of the conversation:

- Images: square 1:1, portrait 3:4, landscape 16:9, and phone 9:16 at 2K.
- Video: vertical 9:16, landscape 16:9, and square 1:1 at 5 seconds; 720P for previews and 1080P for landscape finals.

Recommended settings are included with the question. Reply with the subject and usage, or say “use the recommendation”. If the subject is clear but format details are missing, the plugin picks a preset that matches the intended use, generates immediately, and states the settings in the result.

## Storage

History and media live under `$DSH_PROFILE_DIR/agnes-studio/` when the Host exposes that variable, otherwise `~/.dsh/agnes-studio/`. The history file is capped at the newest 500 records.
