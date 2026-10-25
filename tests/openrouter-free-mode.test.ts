import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');

test('OpenRouter uses the free router by default, not a potentially paid model', () => {
  assert.match(app, /openrouter:\{label:"OpenRouter",url:"https:\/\/openrouter\.ai\/api\/v1\/chat\/completions",model:"openrouter\/free"/);
  assert.match(app, /s\.model\|\|\(id==="openrouter"\?"openrouter\/free":p\.model\)/);
});

test('OpenRouter free models can be discovered and selected without relying on catalog availability', () => {
  assert.match(app, /url = "https:\/\/openrouter\.ai\/api\/v1\/models\?output_modalities=text"/);
  assert.match(app, /raw\.unshift\(\{ id: "openrouter\/free"/);
  assert.match(app, /model\.id\.endsWith\(":free"\)/);
  assert.match(app, /model\.id === "openrouter\/free"/);
  assert.match(html, /id="free-models-only" checked/);
});

test('OpenRouter credentials use the secure-secret path and are not persisted in localStorage', () => {
  assert.match(app, /saveProviderSecret\(id,p\.key\)/);
  assert.match(app, /readProviderSecret\(id\)/);
  assert.match(app, /delete copy\.key/);
  assert.match(html, /OpenRouter: model gratis dipilih otomatis lewat openrouter\/free/);
  assert.match(html, /model berbayar bisa menghabiskan kredit/);
});
