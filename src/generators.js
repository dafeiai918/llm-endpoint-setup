/**
 * llm-endpoint-setup — core generators.
 *
 * Pure ESM, zero dependencies. Runs unchanged in Node >= 18 and in the browser.
 *
 * Every generator takes `{ baseUrl, apiKey, model }` and returns a string the
 * user can paste or save verbatim. Generators never throw on missing input —
 * `normalize()` fills in placeholders first.
 */

const trimTrailingSlash = (value) => String(value ?? '').trim().replace(/\/+$/, '');

/** Escape a value for embedding inside a double-quoted literal. */
const str = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const json = (value) => JSON.stringify(value, null, 2);

/**
 * Fill in defaults so every generator can assume all three fields are present.
 * @param {{ baseUrl?: string, apiKey?: string, model?: string }} [input]
 */
export function normalize(input = {}) {
  return {
    baseUrl: trimTrailingSlash(input.baseUrl) || 'https://your-endpoint.example/v1',
    apiKey: String(input.apiKey ?? '').trim() || 'YOUR_API_KEY',
    model: String(input.model ?? '').trim() || 'your-model-name',
  };
}

/**
 * @typedef {object} Client
 * @property {string} id      Stable slug, also used as the CLI `--client` value.
 * @property {string} name    Human-readable name shown in the UI.
 * @property {'file'|'gui'} kind  'file' output is a real config file; 'gui' output is setup steps.
 * @property {string} lang    Highlighting hint for the UI.
 * @property {string} summary One line describing what the generated output does.
 * @property {string} [path]  Where the generated file goes (kind === 'file').
 * @property {(c: {baseUrl: string, apiKey: string, model: string}) => string} generate
 */

/** @type {Client[]} */
export const CLIENTS = [
  {
    id: 'sillytavern',
    name: 'SillyTavern',
    kind: 'gui',
    lang: 'text',
    summary: 'Connect SillyTavern to a custom OpenAI-compatible endpoint.',
    generate: (c) =>
      [
        '1. Open SillyTavern and click the plug icon (API Connections).',
        '2. API: Chat Completion',
        '3. Chat Completion Source: Custom (OpenAI-compatible)',
        `4. Custom Endpoint (Base URL): ${c.baseUrl}`,
        `5. Reveal "Custom API key" and paste: ${c.apiKey}`,
        `6. Available Models: ${c.model}`,
        '7. Click Connect, then pick the model in the top bar.',
        '',
        'These are the same values SillyTavern writes to settings.json:',
        '',
        json({
          chat_completion_source: 'custom',
          custom_url: c.baseUrl,
          custom_model: c.model,
        }),
      ].join('\n'),
  },

  {
    id: 'cherry-studio',
    name: 'Cherry Studio',
    kind: 'gui',
    lang: 'text',
    summary: 'Add a custom OpenAI-compatible provider.',
    generate: (c) =>
      [
        '1. Settings -> Model Providers -> Add Provider.',
        '2. Provider Type: OpenAI',
        `3. API Host: ${c.baseUrl}`,
        `4. API Key: ${c.apiKey}`,
        `5. Click "Manage Models" and add the model id: ${c.model}`,
        '6. Toggle the model on, then select it in the chat toolbar.',
      ].join('\n'),
  },

  {
    id: 'cursor',
    name: 'Cursor',
    kind: 'gui',
    lang: 'text',
    summary: 'Override the OpenAI base URL in Cursor.',
    generate: (c) =>
      [
        '1. Cursor Settings (Ctrl/Cmd + Shift + J) -> Models.',
        '2. Enable "OpenAI API Key".',
        `3. Paste the key: ${c.apiKey}`,
        '4. Enable "Override OpenAI Base URL".',
        `5. Set the base URL to: ${c.baseUrl}`,
        `6. Under "Add model", add: ${c.model}`,
        '7. Make sure the toggle next to the model is ON, then click Verify.',
        '',
        'Note: Cursor appends /chat/completions to whatever you enter, so the',
        'base URL must include the /v1 suffix if your endpoint expects one.',
      ].join('\n'),
  },

  {
    id: 'cline',
    name: 'Cline (VS Code)',
    kind: 'file',
    lang: 'json',
    path: 'VS Code settings.json — Ctrl/Cmd+Shift+P -> "Preferences: Open User Settings (JSON)"',
    summary: 'Point Cline at your endpoint as an OpenAI-compatible provider.',
    generate: (c) =>
      json({
        'cline.apiProvider': 'openai',
        'cline.openAiBaseUrl': c.baseUrl,
        'cline.openAiApiKey': c.apiKey,
        'cline.openAiModelId': c.model,
      }),
  },

  {
    id: 'continue',
    name: 'Continue (VS Code / JetBrains)',
    kind: 'file',
    lang: 'json',
    path: '~/.continue/config.json  (Windows: C:\\Users\\<you>\\.continue\\config.json)',
    summary: 'Register your endpoint as a model in Continue.',
    generate: (c) =>
      json({
        models: [
          {
            title: c.model,
            provider: 'openai',
            model: c.model,
            apiBase: c.baseUrl,
            apiKey: c.apiKey,
          },
        ],
      }),
  },

  {
    id: 'aider',
    name: 'Aider',
    kind: 'file',
    lang: 'bash',
    path: '`.env` in your project root',
    summary: 'Environment variables plus the command to launch aider.',
    generate: (c) =>
      [
        '# .env — place in your project root',
        `OPENAI_API_BASE=${c.baseUrl}`,
        `OPENAI_API_KEY=${c.apiKey}`,
        '',
        '# Then run:',
        `aider --model openai/${c.model}`,
      ].join('\n'),
  },

  {
    id: 'litellm',
    name: 'LiteLLM Proxy',
    kind: 'file',
    lang: 'yaml',
    path: 'config.yaml',
    summary: 'Proxy your endpoint behind LiteLLM for routing and logging.',
    generate: (c) =>
      [
        'model_list:',
        '  - model_name: my-endpoint',
        '    litellm_params:',
        `      model: openai/${str(c.model)}`,
        `      api_base: "${str(c.baseUrl)}"`,
        `      api_key: "${str(c.apiKey)}"`,
        '',
        '# Run:  litellm --config config.yaml',
        '# Then call it with model="my-endpoint".',
      ].join('\n'),
  },

  {
    id: 'librechat',
    name: 'LibreChat',
    kind: 'file',
    lang: 'yaml',
    path: 'librechat.yaml',
    summary: 'Add your endpoint as a custom LibreChat endpoint.',
    generate: (c) =>
      [
        'version: 1.2.8',
        'endpoints:',
        '  custom:',
        '    - name: "My Endpoint"',
        `      apiKey: "${str(c.apiKey)}"`,
        `      baseURL: "${str(c.baseUrl)}"`,
        '      models:',
        `        default: ["${str(c.model)}"]`,
        '        fetch: false',
        '      titleConvo: true',
        '      modelDisplayLabel: "My Endpoint"',
      ].join('\n'),
  },

  {
    id: 'open-webui',
    name: 'Open WebUI',
    kind: 'file',
    lang: 'bash',
    path: 'Environment variables for the container, or Admin Settings -> Connections',
    summary: 'Connect Open WebUI to your endpoint via env vars.',
    generate: (c) =>
      [
        '# Option A — set before starting the container:',
        `OPENAI_API_BASE_URL=${c.baseUrl}`,
        `OPENAI_API_KEY=${c.apiKey}`,
        '',
        '# Option B — in the UI, after first launch:',
        '#   Admin Settings -> Connections -> OpenAI -> "+"',
        `#   URL: ${c.baseUrl}`,
        `#   Key: ${c.apiKey}`,
        `#   Then add the model id manually: ${c.model}`,
      ].join('\n'),
  },

  {
    id: 'jan',
    name: 'Jan',
    kind: 'gui',
    lang: 'text',
    summary: 'Add a custom OpenAI-compatible provider in Jan.',
    generate: (c) =>
      [
        '1. Settings -> Providers -> Add Provider.',
        '2. Choose the OpenAI-compatible option.',
        `3. Base URL: ${c.baseUrl}`,
        `4. API Key: ${c.apiKey}`,
        `5. Add the model id: ${c.model}`,
        '6. Select the model in a new chat.',
      ].join('\n'),
  },

  {
    id: 'openai-python',
    name: 'OpenAI Python SDK',
    kind: 'file',
    lang: 'python',
    path: 'your_script.py',
    summary: 'Official SDK pointed at your endpoint.',
    generate: (c) =>
      [
        'from openai import OpenAI',
        '',
        'client = OpenAI(',
        `    base_url="${str(c.baseUrl)}",`,
        `    api_key="${str(c.apiKey)}",`,
        ')',
        '',
        'response = client.chat.completions.create(',
        `    model="${str(c.model)}",`,
        '    messages=[{"role": "user", "content": "Hello"}],',
        ')',
        '',
        'print(response.choices[0].message.content)',
      ].join('\n'),
  },

  {
    id: 'openai-node',
    name: 'OpenAI Node SDK',
    kind: 'file',
    lang: 'javascript',
    path: 'your_script.mjs',
    summary: 'Official JS SDK pointed at your endpoint.',
    generate: (c) =>
      [
        "import OpenAI from 'openai';",
        '',
        'const client = new OpenAI({',
        `  baseURL: "${str(c.baseUrl)}",`,
        `  apiKey: "${str(c.apiKey)}",`,
        '});',
        '',
        'const response = await client.chat.completions.create({',
        `  model: "${str(c.model)}",`,
        "  messages: [{ role: 'user', content: 'Hello' }],",
        '});',
        '',
        'console.log(response.choices[0].message.content);',
      ].join('\n'),
  },
];

/** Look up a single client by id. Returns undefined when not found. */
export function getClient(id) {
  return CLIENTS.find((client) => client.id === id);
}

/**
 * Generate output for one client.
 * @param {string} id
 * @param {{ baseUrl?: string, apiKey?: string, model?: string }} input
 * @returns {string}
 */
export function generate(id, input) {
  const client = getClient(id);
  if (!client) {
    throw new Error(
      `Unknown client "${id}". Available: ${CLIENTS.map((c) => c.id).join(', ')}`,
    );
  }
  return client.generate(normalize(input));
}

/**
 * Generate output for every client.
 * @param {{ baseUrl?: string, apiKey?: string, model?: string }} input
 * @returns {Record<string, string>} keyed by client id
 */
export function generateAll(input) {
  const config = normalize(input);
  return Object.fromEntries(CLIENTS.map((c) => [c.id, c.generate(config)]));
}

/** File extension to use when writing a client's output to disk. */
export const EXTENSIONS = {
  json: '.json',
  yaml: '.yaml',
  bash: '.env',
  python: '.py',
  javascript: '.mjs',
  text: '.txt',
};
