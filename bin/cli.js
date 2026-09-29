#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLIENTS, EXTENSIONS, getClient, generate, generateAll, normalize } from '../src/generators.js';

const USAGE = `
llm-endpoint-setup — generate ready-to-paste configs for an OpenAI-compatible endpoint.

Usage
  $ llm-endpoint-setup --base-url <url> --api-key <key> --model <id> [--client <id> ...]

Options
  --base-url <url>    Endpoint base URL, e.g. https://api.example.com/v1
  --api-key <key>     API key. Omit to emit the YOUR_API_KEY placeholder.
  --model <id>        Model id to write into the config.
  --client <id>       Client to generate for. Repeatable. Defaults to all.
  --out <dir>         Write one file per client into <dir> instead of printing.
  --json              Print a JSON object keyed by client id.
  --list              List supported clients and exit.
  -h, --help          Show this message.

Examples
  $ llm-endpoint-setup --base-url https://api.example.com/v1 --model gpt-4o --client cline
  $ llm-endpoint-setup --base-url https://api.example.com/v1 --api-key sk-x --out ./configs
  $ llm-endpoint-setup --list
`.trim();

function main() {
  let parsed;
  try {
    parsed = parseArgs({
      options: {
        'base-url': { type: 'string' },
        'api-key': { type: 'string' },
        model: { type: 'string' },
        client: { type: 'string', multiple: true },
        out: { type: 'string' },
        json: { type: 'boolean', default: false },
        list: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: false,
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${USAGE}\n`);
    process.exitCode = 1;
    return;
  }

  const { values } = parsed;

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  if (values.list) {
    const width = Math.max(...CLIENTS.map((c) => c.id.length));
    for (const client of CLIENTS) {
      process.stdout.write(`${client.id.padEnd(width)}  ${client.kind === 'file' ? '[file]' : '[gui] '}  ${client.name}\n`);
    }
    return;
  }

  const config = normalize({
    baseUrl: values['base-url'],
    apiKey: values['api-key'],
    model: values.model,
  });

  const requested = values.client?.length ? values.client : CLIENTS.map((c) => c.id);

  for (const id of requested) {
    if (!getClient(id)) {
      process.stderr.write(
        `Unknown client "${id}". Available: ${CLIENTS.map((c) => c.id).join(', ')}\n`,
      );
      process.exitCode = 1;
      return;
    }
  }

  if (values.json) {
    const payload = Object.fromEntries(requested.map((id) => [id, generate(id, config)]));
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (values.out) {
    mkdirSync(values.out, { recursive: true });
    for (const id of requested) {
      const client = getClient(id);
      const extension = EXTENSIONS[client.lang] ?? '.txt';
      // GUI clients produce instructions, not files — prefix so they aren't mistaken for configs.
      const filename = client.kind === 'file' ? `${id}${extension}` : `${id}.setup.txt`;
      writeFileSync(join(values.out, filename), `${generate(id, config)}\n`, 'utf8');
      process.stdout.write(`wrote ${join(values.out, filename)}\n`);
    }
    return;
  }

  for (const id of requested) {
    const client = getClient(id);
    process.stdout.write(`\n${'='.repeat(72)}\n${client.name}  (${id})\n`);
    if (client.path) process.stdout.write(`-> ${client.path}\n`);
    process.stdout.write(`${'='.repeat(72)}\n\n${generate(id, config)}\n`);
  }
}

main();
