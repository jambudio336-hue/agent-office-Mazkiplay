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


test('native device bridge is packaged with explicit opt-in accessibility', () => {
  const plugin = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayDeviceBridgePlugin.java', import.meta.url), 'utf8');
  const service = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayAccessibilityService.java', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/android-apk.yml', import.meta.url), 'utf8');
  const activity = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MainActivity.java', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../android-standalone/native-android/src/main/res/xml/mazkiplay_accessibility_service.xml', import.meta.url), 'utf8');
  assert.match(html, /id="device-accessibility-status"/);
  assert.match(html, /id="device-read-screen"/);
  assert.match(app, /MazkiplayDeviceBridge/);
  assert.match(plugin, /Settings\.ACTION_ACCESSIBILITY_SETTINGS/);
  assert.match(plugin, /readScreenSummary/);
  assert.match(service, /if \(node\.isPassword\(\)\) return/);
  assert.match(service, /does not click, type, submit forms/i);
  assert.match(config, /canRetrieveWindowContent="true"/);
  assert.match(config, /canPerformGestures="false"/);
  assert.match(activity, /registerPlugin\(MazkiplayDeviceBridgePlugin\.class\)/);
  assert.match(workflow, /MazkiplayAccessibilityService\.java/);
  assert.match(workflow, /BIND_ACCESSIBILITY_SERVICE/);
});
