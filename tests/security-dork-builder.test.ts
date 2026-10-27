import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const chat = readFileSync(path.join(root, 'src/client/chat.ts'), 'utf8');
const html = readFileSync(path.join(root, 'src/client/chat.html'), 'utf8');
const css = readFileSync(path.join(root, 'src/client/chat.css'), 'utf8');

test('Google Dork Builder is visible and only creates passive search URLs', () => {
  assert.match(html, /Google Dork Builder/);
  assert.match(chat, /function dorkBuilderDialog\(/);
  assert.match(chat, /https:\/\/www\.google\.com\/search\?q=/);
  assert.match(chat, /encodeURIComponent\(query\)/);
  assert.match(chat, /site:\+domain/);
  assert.match(chat, /domain\.includes\('\/'\)/);
  assert.match(chat, /tidak mengakses server/);
  assert.match(css, /\.dork-results/);
});

test('Dork presets do not include secret values or exploit payloads', () => {
  assert.match(chat, /filetype:env/);
  assert.match(chat, /filetype:bak/);
  assert.match(chat, /intitle:"index of"/);
  assert.doesNotMatch(chat, /curl\s+.*\|\s*(sh|bash)/i);
  assert.doesNotMatch(chat, /password=.{3,}/i);
});
