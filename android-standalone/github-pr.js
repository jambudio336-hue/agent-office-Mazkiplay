const $ = id => document.getElementById(id);
const secureStore = () => window.Capacitor?.Plugins?.MazkiplaySecureStorage || null;
let token = "";
let loaded = null;

function status(message, bad = false) {
  const el = $("github-pr-status");
  if (el) {
    el.textContent = message;
    el.style.color = bad ? "#ff7e8a" : "#64e0a4";
  }
}
function validRepo(value) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.trim());
}
function apiPath(repo, suffix) {
  return "/repos/" + repo.trim() + suffix;
}
async function requestGitHub(path, method = "GET", body = undefined) {
  if (!token) throw Error("Token GitHub tidak tersedia. Hubungkan GitHub terlebih dahulu di Hub GitHub.");
  const options = {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const http = window.Capacitor?.Plugins?.CapacitorHttp;
  let result;
  if (http?.request) {
    const r = await http.request({
      url: "https://api.github.com" + path,
      method,
      headers: options.headers,
      data: body,
      connectTimeout: 20000,
      readTimeout: 60000
    });
    result = { ok: r.status >= 200 && r.status < 300, status: r.status, data: r.data };
  } else {
    const r = await fetch("https://api.github.com" + path, options);
    let data = {};
    try { data = await r.json(); } catch {}
    result = { ok: r.ok, status: r.status, data };
  }
  if (!result.ok) {
    const message = result.data?.message || "Periksa token dan izin repository.";
    if (result.status === 401 || result.status === 403) {
      throw Error("GitHub HTTP " + result.status + ": " + message + ". Untuk membuat PR, token fine-grained memerlukan Contents: Read and write serta Pull requests: Read and write.");
    }
    throw Error("GitHub HTTP " + result.status + ": " + message);
  }
  return result.data;
}
function decodeContent(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}
function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
function filePath(path) {
  return path.trim().split("/").map(encodeURIComponent).join("/");
}
async function loadExistingFile() {
  const repo = $("github-pr-repo").value.trim();
  const base = $("github-pr-base").value.trim();
  const path = $("github-pr-path").value.trim();
  if (!validRepo(repo)) throw Error("Format repository harus owner/nama-repo.");
  if (!base || !path) throw Error("Isi branch dasar dan path file.");
  const file = await requestGitHub(apiPath(repo, "/contents/" + filePath(path) + "?ref=" + encodeURIComponent(base)));
  if (Array.isArray(file) || file.type !== "file") throw Error("Path harus menunjuk satu file, bukan direktori.");
  if (file.size > 1000000) throw Error("File lebih dari 1 MB. Untuk keamanan, file besar belum didukung.");
  if (file.encoding !== "base64") throw Error("Encoding file tidak didukung.");
  loaded = { repo, base, path: file.path, sha: file.sha };
  $("github-pr-path").value = file.path;
  $("github-pr-code").value = decodeContent(file.content);
  status("File dimuat dari " + repo + " @ " + base + ". Periksa dan edit isi kode sebelum membuat PR.");
}
$("github-pr-load").addEventListener("click", async () => {
  const button = $("github-pr-load");
  button.disabled = true;
  button.textContent = "Memuat file…";
  try { await loadExistingFile(); }
  catch (error) { status(error?.message || "Gagal memuat file.", true); }
  finally { button.disabled = false; button.textContent = "Muat file untuk diedit"; }
});
$("github-pr-create").addEventListener("click", async () => {
  const button = $("github-pr-create");
  const repo = $("github-pr-repo").value.trim();
  const base = $("github-pr-base").value.trim();
  const branch = $("github-pr-branch").value.trim();
  const path = $("github-pr-path").value.trim();
  const content = $("github-pr-code").value;
  const title = $("github-pr-title").value.trim();
  const message = $("github-pr-commit").value.trim();
  const body = $("github-pr-body").value.trim();
  if (!validRepo(repo)) return status("Format repository harus owner/nama-repo.", true);
  if (!base || !branch || branch === base) return status("Branch patch harus diisi dan berbeda dari branch dasar.", true);
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith("/") || branch.endsWith("/") || branch.includes("..")) return status("Nama branch tidak valid.", true);
  if (!path || !content.trim() || !title || !message) return status("Path, isi file, judul PR, dan pesan commit wajib diisi.", true);
  if (!loaded || loaded.repo !== repo || loaded.base !== base || loaded.path !== path) return status("Muat file dari branch dasar terlebih dahulu agar SHA file tervalidasi.", true);
  if (content.length > 1000000) return status("Isi file melebihi batas 1 MB.", true);
  if (!confirm("Buat branch baru, commit isi file ini, lalu buka DRAFT pull request? Branch dasar tidak akan diubah langsung.")) return;
  button.disabled = true;
  button.textContent = "Membuat draft PR…";
  try {
    const ref = await requestGitHub(apiPath(repo, "/git/ref/heads/" + base.split("/").map(encodeURIComponent).join("/")));
    await requestGitHub(apiPath(repo, "/git/refs"), "POST", { ref: "refs/heads/" + branch, sha: ref.object.sha });
    await requestGitHub(apiPath(repo, "/contents/" + filePath(path)), "PUT", {
      message,
      content: encodeContent(content),
      sha: loaded.sha,
      branch
    });
    const pr = await requestGitHub(apiPath(repo, "/pulls"), "POST", {
      title,
      body: body + "\n\nDibuat dari Mazkiplay Agent Office. Perubahan perlu ditinjau dan diuji sebelum merge.",
      head: branch,
      base,
      draft: true
    });
    status("Draft PR berhasil dibuat: #" + pr.number + " — " + pr.html_url + ". Branch dasar belum di-merge. Periksa tab Files changed dan jalankan pengujian sebelum review.");
    $("github-pr-result").innerHTML = '<a href="' + String(pr.html_url).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '" target="_blank" rel="noopener noreferrer">Buka Draft Pull Request #' + Number(pr.number) + "</a>";
  } catch (error) {
    status(error?.message || "Gagal membuat draft PR.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Buat branch + commit + Draft PR";
  }
});
window.addEventListener("github-token-disconnected", () => {
  token = "";
  loaded = null;
  status("Token GitHub diputus. Hubungkan kembali sebelum membuat Draft PR.", true);
});
window.addEventListener("github-token-connected", async () => {
  try {
    const store = secureStore();
    const result = store?.get ? await store.get({ key: "github:token" }) : null;
    token = result?.value == null ? "" : String(result.value);
    status(token ? "Token aman tersedia. Tinjau file dan perubahan sebelum membuat Draft PR." : "Token aman tidak tersedia; hubungkan kembali dari APK Android.", !token);
  } catch (error) {
    token = "";
    status("Gagal membaca token aman: " + (error?.message || "kesalahan"), true);
  }
});
async function initPatchLab() {
  try {
    const store = secureStore();
    const result = store?.get ? await store.get({ key: "github:token" }) : null;
    token = result?.value == null ? "" : String(result.value);
    status(token ? "Token ditemukan di Android Keystore. Pastikan token memiliki Contents write dan Pull requests write." : "Hubungkan GitHub di atas terlebih dahulu. Fitur tulis hanya tersedia saat token tersimpan aman di APK Android.", !token);
  } catch (error) {
    status("Tidak bisa membaca token dari Android Keystore: " + (error?.message || "kesalahan"), true);
  }
}
initPatchLab();
