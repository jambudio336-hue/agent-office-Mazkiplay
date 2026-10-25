import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');
const canvas = readFileSync(new URL('../android-standalone/canvas-workspace.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../android-standalone/styles.css', import.meta.url), 'utf8');

test('Android standalone JavaScript and embedded office activity script parse without syntax errors', () => {
  try { new Script(app, { filename: 'android-standalone/app.js' }); } catch (error) { assert.fail('app.js parse error: ' + error.stack); }
  assert.doesNotThrow(() => new Script(canvas, { filename: 'android-standalone/canvas-workspace.js' }));
  const inlineOffice = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(inlineOffice, 'inline office activity script exists');
  assert.doesNotThrow(() => new Script(inlineOffice[1], { filename: 'android-standalone/index.html#office-script' }));
});

test('Canvas has a multi-file explorer, local persistence, safe paths, and project export', () => {
  for (const id of ['canvas-file-tree', 'canvas-new-file', 'canvas-save-project', 'canvas-export-project', 'canvas-preview']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(canvas, /mazkiplay-canvas-workspace-v2/);
  assert.match(canvas, /function safePath/);
  assert.match(canvas, /part === "\.\."/);
  assert.match(canvas, /function renderTree/);
  assert.match(canvas, /JSON\.stringify\(\{name:"Mazkiplay project"/);
  assert.match(html, /sandbox="allow-forms allow-modals allow-scripts"/);
  assert.match(css, /\.canvas-workspace-pro/);
});

test('AI task results can be opened in Canvas and real task state reaches the office log', () => {
  assert.match(app, /data-canvas-result=/);
  assert.match(app, /mazkiplay:canvas-result/);
  assert.match(app, /mazkiplay:office-task/);
  assert.match(html, /addEventListener\('mazkiplay:office-task'/);
  assert.match(html, /gerakan idle tetap simulasi/i);
});
