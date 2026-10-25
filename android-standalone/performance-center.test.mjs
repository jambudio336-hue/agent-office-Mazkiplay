import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("./performance-center.js", import.meta.url), "utf8");

function createHarness({ stored = "{}", storageEstimate = { usage: 1024, quota: 4096 }, state = { workers: [{ id: "w1" }], tasks: [{ id: "t1" }, { id: "t2" }] }, runtimeFailure = false } = {}) {
  const listeners = {};
  const elements = new Map();
  const classes = new Set();
  const local = new Map([
    ["mazkiplay-performance-v1", stored],
    ["mazkiplay-agent-office-v1", JSON.stringify(state)]
  ]);
  const element = (id) => {
    if (!elements.has(id)) {
      const handlers = {};
      elements.set(id, {
        id, checked: false, disabled: false, textContent: "", style: {},
        attributes: {}, handlers,
        addEventListener(type, callback) { handlers[type] = callback; },
        setAttribute(name, value) { this.attributes[name] = value; }
      });
    }
    return elements.get(id);
  };
  const document = {
    body: { classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); }
    } },
    getElementById: element,
    addEventListener(type, callback) { listeners[type] = callback; }
  };
  const localStorage = {
    getItem(key) { return local.has(key) ? local.get(key) : null; },
    setItem(key, value) { local.set(key, value); }
  };
  const navigator = {
    hardwareConcurrency: 8,
    deviceMemory: 4,
    platform: "Android",
    onLine: true,
    storage: { estimate: async () => storageEstimate }
  };
  if (runtimeFailure) {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get() { throw new Error("hardware probe failed"); }
    });
  }
  vm.runInNewContext(source, { document, localStorage, navigator, JSON, Number, String, Math, Promise });
  return { listeners, element, classes, local, document };
}

test("restores the saved reduced-motion preference on startup", () => {
  const h = createHarness({ stored: JSON.stringify({ liteMode: true }) });
  h.listeners.DOMContentLoaded();
  assert.equal(h.classes.has("perf-lite"), true);
  assert.equal(h.element("performance-lite").checked, true);
  assert.equal(h.element("performance-lite").attributes["aria-checked"], "true");
  assert.match(h.element("performance-status").textContent, /Mode Hemat Performa aktif/);
});

test("persists the user's performance-mode toggle", () => {
  const h = createHarness();
  h.listeners.DOMContentLoaded();
  h.element("performance-lite").handlers.change({ target: { checked: true } });
  assert.equal(h.classes.has("perf-lite"), true);
  assert.deepEqual(JSON.parse(h.local.get("mazkiplay-performance-v1")), { liteMode: true });
  h.element("performance-lite").handlers.change({ target: { checked: false } });
  assert.equal(h.classes.has("perf-lite"), false);
  assert.deepEqual(JSON.parse(h.local.get("mazkiplay-performance-v1")), { liteMode: false });
});

test("diagnostics show local counts and storage estimates without network calls", async () => {
  const h = createHarness();
  h.listeners.DOMContentLoaded();
  await h.element("performance-check").handlers.click();
  const output = h.element("performance-diagnostics").textContent;
  assert.match(output, /Thread logis: 8/);
  assert.match(output, /RAM perkiraan: 4 GB/);
  assert.match(output, /Penyimpanan origin terpakai: 1.0 KB/);
  assert.match(output, /Profil karyawan tersimpan: 1/);
  assert.match(output, /Tugas tersimpan: 2/);
  assert.match(output, /tidak mengirim data ke server/);
  assert.equal(h.element("performance-check").disabled, false);
});

test("diagnostics degrade gracefully when storage estimates and local state are unavailable", async () => {
  const h = createHarness({ storageEstimate: null, state: null });
  h.listeners.DOMContentLoaded();
  await h.element("performance-check").handlers.click();
  const output = h.element("performance-diagnostics").textContent;
  assert.match(output, /Estimasi kuota penyimpanan: tidak didukung runtime/);
  assert.match(output, /Ringkasan data aplikasi tidak dapat dibaca/);
});

test("diagnostics report unexpected runtime errors and always re-enable the button", async () => {
  const h = createHarness({ runtimeFailure: true });
  h.listeners.DOMContentLoaded();
  await h.element("performance-check").handlers.click();
  assert.match(h.element("performance-diagnostics").textContent, /hardware probe failed/);
  assert.equal(h.element("performance-check").disabled, false);
});
