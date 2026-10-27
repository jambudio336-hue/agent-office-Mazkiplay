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


test('Security Toolkit utilities are available and documented', () => {
  assert.match(html, /data-action="security-toolkit"/);
  assert.match(chat, /function securityToolkitDialog\(/);
  assert.match(chat, /crypto\.getRandomValues/);
  assert.match(chat, /crypto\.subtle\.digest\('SHA-256'/);
  assert.match(chat, /encodeURIComponent/);
  assert.match(chat, /decodeURIComponent/);
});

test('Scope Manager, local Secret Scanner, and report generator are available', () => {
  assert.match(html, /data-action="scope-manager"/);
  assert.match(html, /data-action="secret-scanner"/);
  assert.match(html, /data-action="report-generator"/);
  assert.match(chat, /function scopeManagerDialog\(/);
  assert.match(chat, /function secretScannerDialog\(/);
  assert.match(chat, /function reportGeneratorDialog\(/);
  assert.match(chat, /mazkiplay\.security\.scope\.v1/);
  assert.match(chat, /crypto|Private key PEM/);
  assert.match(chat, /text\/markdown;charset=utf-8/);
  assert.match(readme, /Scope Manager/);
  assert.match(readme, /Secret Scanner/);
  assert.match(readme, /Security Report Generator/);
  assert.match(changelog, /Security Workspace/);
});
