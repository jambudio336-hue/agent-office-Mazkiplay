import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const chat = readFileSync(path.join(root, 'src/client/chat.ts'), 'utf8');
const html = readFileSync(path.join(root, 'src/client/chat.html'), 'utf8');
const css = readFileSync(path.join(root, 'src/client/chat.css'), 'utf8');
const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
const changelog = readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');

test('IP lookup provides approximate geolocation and Google Maps link', () => {
  assert.match(html, /IP Geolocation Lookup/);
  assert.match(chat, /function ipLookupDialog\(/);
  assert.match(chat, /https:\/\/ipapi\.co\//);
  assert.match(chat, /https:\/\/www\.google\.com\/maps\/search/);
  assert.match(chat, /Bukan lokasi perangkat secara real-time/);
  assert.match(chat, /noopener noreferrer/);
});

test('README and changelog describe privacy limits and development status', () => {
  assert.match(readme, /IP Geolocation Lookup/);
  assert.match(readme, /not.*live GPS|not a person's live GPS position/i);
  assert.match(readme, /CHANGELOG\.md/);
  assert.match(changelog, /Validation status/);
  assert.match(changelog, /ipapi\.co/);
});

test('motion effects respect reduced-motion preference', () => {
  assert.match(css, /@keyframes cyberPulse/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
