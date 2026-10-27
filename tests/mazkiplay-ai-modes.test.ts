import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const chat = readFileSync(path.join(root, 'src/client/chat.ts'), 'utf8');
const html = readFileSync(path.join(root, 'src/client/chat.html'), 'utf8');

test('AI settings expose local no-key and offline fallback modes', () => {
  assert.match(chat, /provider:'openrouter'\|'openai'\|'custom'\|'local'\|'offline'/);
  assert.match(html, /Pengaturan & API Key/);
  assert.match(chat, /value="local"/);
  assert.match(chat, /value="offline"/);
  assert.match(chat, /function offlineAnswer\(/);
  assert.match(chat, /settings\.provider==='offline'/);
  assert.match(chat, /settings\.provider==='local'/);
});

test('local OpenAI-compatible endpoint does not require a provider API key', () => {
  assert.match(chat, /settings\.provider!=='local'&&!settings\.apiKey/);
  assert.match(chat, /settings\.apiKey\?\{'Authorization':'Bearer '\+settings\.apiKey\}:\{\}/);
  assert.match(chat, /127\.0\.0\.1:11434\/v1/);
});

test('offline assistant is honest about its limited rule-based capability', () => {
  assert.match(chat, /bukan LLM/);
  assert.match(chat, /tidak dapat melakukan penalaran LLM/);
  assert.match(chat, /tidak dapat melakukan pemindaian atau eksekusi perintah/);
});
