import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');
const plugin = readFileSync(new URL('../android-standalone/plugin-manager.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');

test('Plugin Hub is included in Android standalone and loads its module', () => {
  assert.match(html, /id="plugin-hub"/);
  assert.match(html, /id="plugin-service"/);
  assert.match(html, /src="\.\/plugin-manager\.js"/);
  assert.match(html, /id="plugin-connected-list"/);
  assert.doesNotThrow(() => new Script(plugin, { filename: 'android-standalone/plugin-manager.js' }));
});

test('Plugin catalog contains read-only smoke checks for developer, backend, hosting, mail and messaging APIs', () => {
  for (const id of ['github', 'supabase', 'vercel', 'netlify', 'gmail', 'whatsapp', 'telegram', 'google_drive', 'google_calendar', 'discord', 'slack']) {
    assert.match(plugin, new RegExp(id + ': \\{name:'));
  }
  assert.match(plugin, /api\.github\.com\/user/);
  assert.match(plugin, /auth\/v1\/health/);
  assert.match(plugin, /api\.vercel\.com\/v9\/projects/);
  assert.match(plugin, /api\.netlify\.com\/api\/v1\/user/);
  assert.match(plugin, /gmail\.googleapis\.com\/gmail\/v1\/users\/me\/profile/);
  assert.match(plugin, /graph\.facebook\.com/);
  assert.match(plugin, /api\.telegram\.org/);
});

test('Plugin credentials use native secure storage and only non-secret metadata is persisted', () => {
  assert.match(plugin, /MazkiplaySecureStorage/);
  assert.match(plugin, /key:"plugin:"\+id/);
  assert.match(plugin, /localStorage\.setItem\(STORE_KEY,JSON\.stringify\(configs\)\)/);
  assert.match(plugin, /window\.dispatchEvent\(new Event\("github-token-connected"\)\)/);
  assert.match(app, /github-token-connected/);
  assert.match(plugin, /service_role|server key/i);
  assert.match(html, /id="plugin-to-task"/);
  assert.match(plugin, /mazkiplay:plugin-context/);
  assert.match(app, /mazkiplay:plugin-context/);
  assert.match(plugin, /summary:detail/);
});
