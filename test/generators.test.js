import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIENTS,
  EXTENSIONS,
  generate,
  generateAll,
  getClient,
  normalize,
} from '../src/generators.js';

const SAMPLE = {
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'sk-test-123',
  model: 'deepseek-chat',
};

test('client ids are unique', () => {
  const ids = CLIENTS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every client declares a known language with an extension', () => {
  for (const client of CLIENTS) {
    assert.ok(client.lang in EXTENSIONS, `${client.id} has unmapped lang "${client.lang}"`);
    assert.ok(['file', 'gui'].includes(client.kind), `${client.id} has bad kind`);
    assert.ok(client.summary.length > 0, `${client.id} is missing a summary`);
  }
});

test('file clients declare where the generated file goes', () => {
  for (const client of CLIENTS.filter((c) => c.kind === 'file')) {
    assert.ok(client.path, `${client.id} is a file client but has no path`);
  }
});

test('normalize fills every placeholder', () => {
  assert.deepEqual(normalize(), {
    baseUrl: 'https://your-endpoint.example/v1',
    apiKey: 'YOUR_API_KEY',
    model: 'your-model-name',
  });
});

test('normalize strips trailing slashes and whitespace', () => {
  assert.equal(normalize({ baseUrl: '  https://x.dev/v1///  ' }).baseUrl, 'https://x.dev/v1');
});

test('every generator embeds all three values', () => {
  for (const client of CLIENTS) {
    const output = client.generate(normalize(SAMPLE));
    assert.ok(output.length > 0, `${client.id} produced nothing`);
    assert.ok(output.includes(SAMPLE.baseUrl), `${client.id} dropped the base URL`);
    assert.ok(output.includes(SAMPLE.model), `${client.id} dropped the model`);
    // GUI instructions intentionally hide the key behind a UI step, so only
    // assert on the clients that emit a real config file.
    if (client.kind === 'file') {
      assert.ok(output.includes(SAMPLE.apiKey), `${client.id} dropped the API key`);
    }
  }
});

test('every file client produces parseable JSON or non-empty text', () => {
  for (const client of CLIENTS.filter((c) => c.lang === 'json')) {
    const output = client.generate(normalize(SAMPLE));
    assert.doesNotThrow(() => JSON.parse(output), `${client.id} emitted invalid JSON`);
  }
});

test('quotes in values are escaped in embedded literals', () => {
  const output = generate('openai-python', {
    baseUrl: 'https://x.dev/v1',
    apiKey: 'sk-"quoted"',
    model: 'm',
  });
  assert.ok(output.includes('sk-\\"quoted\\"'), 'API key was not escaped for Python');
});

test('generate() throws a helpful error for an unknown client', () => {
  assert.throws(() => generate('nope', SAMPLE), /Unknown client "nope"/);
});

test('getClient finds a real client and misses cleanly', () => {
  assert.equal(getClient('cline').name, 'Cline (VS Code)');
  assert.equal(getClient('nope'), undefined);
});

test('generateAll returns one entry per client', () => {
  const all = generateAll(SAMPLE);
  assert.equal(Object.keys(all).length, CLIENTS.length);
  for (const id of Object.keys(all)) {
    assert.ok(all[id].includes(SAMPLE.model));
  }
});
