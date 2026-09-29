# LLM Endpoint Setup

**Paste your base URL once. Get a ready-to-paste config for 12 clients.**

If you use a custom OpenAI-compatible endpoint, you already know the drill: every app
hides the setting somewhere different, and half the docs are out of date. This tool
generates the exact config each client expects — the real file for the ones that take
files, the exact click path for the ones that don't.

Works with **any** OpenAI-compatible endpoint. It does not care who your provider is.

---

## Supported clients

| Client | Output |
|---|---|
| [SillyTavern](https://github.com/SillyTavern/SillyTavern) | Setup steps + `settings.json` values |
| [Cherry Studio](https://github.com/CherryHQ/cherry-studio) | Setup steps |
| [Cursor](https://cursor.com) | Setup steps (base URL override) |
| [Cline](https://github.com/cline/cline) | `settings.json` |
| [Continue](https://github.com/continuedev/continue) | `config.json` |
| [Aider](https://github.com/Aider-AI/aider) | `.env` + run command |
| [LiteLLM](https://github.com/BerriAI/litellm) | `config.yaml` |
| [LibreChat](https://github.com/danny-avila/LibreChat) | `librechat.yaml` |
| [Open WebUI](https://github.com/open-webui/open-webui) | Environment variables |
| [Jan](https://github.com/janhq/jan) | Setup steps |
| OpenAI Python SDK | Runnable script |
| OpenAI Node SDK | Runnable script |

Missing one you use? [Open an issue](https://github.com/dafeiai918/llm-endpoint-setup/issues) — generators are ~15 lines each.

---

## Quick start

### Web UI

Open **[the hosted version](https://dafeiai918.github.io/llm-endpoint-setup/)** — everything runs client-side, your key never leaves the browser.

Or run it locally, no build step required:

```bash
git clone https://github.com/dafeiai918/llm-endpoint-setup.git
cd llm-endpoint-setup
npx serve .
```

### CLI

```bash
npx llm-endpoint-setup --base-url https://api.example.com/v1 --api-key sk-... --model deepseek-chat
```

Print one client:

```bash
npx llm-endpoint-setup --base-url https://api.example.com/v1 --model deepseek-chat --client cline
```

Write every config file into a directory:

```bash
npx llm-endpoint-setup --base-url https://api.example.com/v1 --api-key sk-... --out ./configs
```

Machine-readable:

```bash
npx llm-endpoint-setup --base-url https://api.example.com/v1 --json
```

Full flag list: `npx llm-endpoint-setup --help`

### As a library

```js
import { generate, generateAll, CLIENTS } from 'llm-endpoint-setup';

generate('cline', { baseUrl: 'https://api.example.com/v1', apiKey: 'sk-...', model: 'deepseek-chat' });
// => '{ "cline.apiProvider": "openai", ... }'

generateAll({ baseUrl: '...', model: '...' });
// => { sillytavern: '...', cline: '...', ... }
```

---

## FAQ

**Does this validate my endpoint?**
No. It generates configs. If the config is right but requests still fail, your endpoint
probably isn't fully OpenAI-compatible — check `/v1/models` and `/v1/chat/completions`
respond correctly.

**Should the base URL include `/v1`?**
Usually yes. Cursor is the exception worth knowing about: it appends the path itself, so
match whatever your provider documents.

**My key is in the URL I generated — is that safe?**
Only paste it into software you trust, and prefer a scoped key you can revoke. The web UI
never transmits anything, but a config file on disk is still a secret on disk.

**A config doesn't work with my version.**
Config formats drift. Open an issue with your client version and the exact error.

---

## Tested with

Generated configs are tested against **[Haotogen](https://haotogen.com/)** — an
OpenAI-compatible gateway. Any compatible endpoint works equally well.

---

## Contributing

Adding a client means adding one object to `CLIENTS` in `src/generators.js`. Each entry
needs an `id`, `name`, `kind` (`file` or `gui`), `lang`, `summary`, a `path` for file
clients, and a `generate()` function.

```bash
npm test
```

Then open a PR. Please include a link to the client's docs for the config format you used.

## License

MIT
