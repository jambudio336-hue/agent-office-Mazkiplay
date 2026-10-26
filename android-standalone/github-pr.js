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
function detectPotentialSecrets(files) {
  const patterns = [
    ["private key", /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/],
    ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
    ["GitHub access token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
    ["OpenAI project key", /\bsk-proj-[A-Za-z0-9_-]{30,}\b/],
    ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/]
  ];
  const findings = [];
  for (const file of files) {
    for (const [label, pattern] of patterns) {
      if (pattern.test(String(file.content || ""))) findings.push({ path: file.path, label });
    }
  }
  return findings;
}
function rejectPotentialSecrets(files, report) {
  const findings = detectPotentialSecrets(files);
  if (!findings.length) return false;
  const summary = [...new Set(findings.map(item => item.label + " pada " + item.path))].slice(0, 8);
  report("Pengiriman dibatalkan: pemindai lokal mendeteksi pola yang menyerupai rahasia: " + summary.join("; ") + ". Hapus rahasia dari file dan rotasi kredensial jika pernah terpublikasi.", true);
  return true;
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
$("github-pr-generate").addEventListener("click", async () => {
  const button = $("github-pr-generate");
  const resultBox = $("github-pr-ai-result");
  const instruction = $("github-pr-instruction").value.trim();
  const path = $("github-pr-path").value.trim();
  const content = $("github-pr-code").value;
  if (!loaded || loaded.path !== path || loaded.repo !== $("github-pr-repo").value.trim() || loaded.base !== $("github-pr-base").value.trim()) {
    return status("Muat ulang file dari branch dasar sebelum meminta AI membuat patch.", true);
  }
  if (!instruction) return status("Tuliskan instruksi perubahan untuk AI.", true);
  if (typeof window.mazkiplayGeneratePatch !== "function") {
    return status("Modul AI belum siap. Pastikan app.js berhasil dimuat dan konfigurasi provider sudah tersimpan.", true);
  }
  button.disabled = true;
  button.textContent = "AI sedang menyusun patch…";
  resultBox.textContent = "Meminta AI membuat usulan. Ini bisa memerlukan waktu dan kuota provider.";
  try {
    const proposal = await window.mazkiplayGeneratePatch({ instruction, path, content });
    $("github-pr-code").value = proposal.updatedContent;
    const sections = [
      "RINGKASAN USULAN\n" + proposal.summary,
      "LANGKAH UJI YANG DISARANKAN\n" + (proposal.tests.length ? proposal.tests.map((x, i) => (i + 1) + ". " + x).join("\n") : "AI tidak memberikan langkah uji."),
      "RISIKO / ASUMSI\n" + (proposal.risks.length ? proposal.risks.map((x, i) => (i + 1) + ". " + x).join("\n") : "Tidak dicantumkan.")
    ];
    resultBox.textContent = sections.join("\n\n") + "\n\nIsi editor sudah diperbarui, tetapi belum dikirim ke GitHub. Tinjau seluruh file dan jalankan pengujian sebelum membuat Draft PR.";
    status("Usulan patch AI siap ditinjau. Belum ada commit atau PR yang dibuat.");
  } catch (error) {
    resultBox.textContent = "";
    status("AI gagal membuat patch: " + (error?.message || "kesalahan provider"), true);
  } finally {
    button.disabled = false;
    button.textContent = "✦ Buat usulan patch dengan AI";
  }
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
  if (rejectPotentialSecrets([{ path, content }], status)) return;
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

let multiLoaded = [];
function multiStatus(message, bad = false) {
  const el = $("multi-pr-status");
  if (el) {
    el.textContent = message;
    el.style.color = bad ? "#ff7e8a" : "#64e0a4";
  }
}
function safeRepoPath(path) {
  const value = String(path || "").trim();
  return !!value && !value.startsWith("/") && !value.includes("\\") &&
    value.split("/").every(part => part && part !== "." && part !== "..") &&
    !value.includes("\u0000");
}
function renderMultiEditors() {
  const host = $("multi-pr-editors");
  host.replaceChildren();
  multiLoaded.forEach((file, index) => {
    const section = document.createElement("section");
    section.className = "multi-file-editor";
    const label = document.createElement("label");
    label.textContent = file.path + " — isi file lengkap";
    const area = document.createElement("textarea");
    area.rows = 10;
    area.spellcheck = false;
    area.className = "code-editor";
    area.value = file.currentContent;
    area.setAttribute("aria-label", "Isi file " + file.path);
    area.addEventListener("input", () => { file.currentContent = area.value; });
    label.appendChild(area);
    section.appendChild(label);
    host.appendChild(section);
  });
}
$("multi-pr-load").addEventListener("click", async () => {
  const button = $("multi-pr-load");
  const repo = $("github-pr-repo").value.trim();
  const base = $("github-pr-base").value.trim();
  const paths = [...new Set($("multi-pr-paths").value.split(/\r?\n/).map(x => x.trim()).filter(Boolean))];
  if (!validRepo(repo)) return multiStatus("Format repository harus owner/nama-repo.", true);
  if (!base) return multiStatus("Branch dasar wajib diisi.", true);
  if (paths.length < 1 || paths.length > 5) return multiStatus("Masukkan 1 sampai 5 path file unik.", true);
  if (!paths.every(safeRepoPath)) return multiStatus("Path tidak valid. Hindari path absolut, backslash, titik relatif, atau segmen ..", true);
  button.disabled = true;
  button.textContent = "Memuat file…";
  try {
    const files = [];
    let total = 0;
    for (const path of paths) {
      const file = await requestGitHub(apiPath(repo, "/contents/" + filePath(path) + "?ref=" + encodeURIComponent(base)));
      if (Array.isArray(file) || file.type !== "file") throw Error(path + " bukan file tunggal.");
      if (file.size > 1000000 || file.encoding !== "base64") throw Error(path + " terlalu besar atau encoding tidak didukung.");
      const content = decodeContent(file.content);
      total += content.length;
      if (total > 18000) throw Error("Total isi file lebih dari 18.000 karakter.");
      files.push({ path: file.path, sha: file.sha, originalContent: content, currentContent: content });
    }
    multiLoaded = files;
    renderMultiEditors();
    multiStatus(files.length + " file dimuat. Isi sumber siap diperiksa atau diminta revisi AI.");
  } catch (error) {
    multiStatus(error?.message || "Gagal memuat file.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Muat semua file";
  }
});
$("multi-pr-generate").addEventListener("click", async () => {
  const button = $("multi-pr-generate");
  const instruction = $("multi-pr-instruction").value.trim();
  if (!multiLoaded.length) return multiStatus("Muat file terlebih dahulu.", true);
  if (!instruction) return multiStatus("Tuliskan instruksi perubahan lintas file.", true);
  if (typeof window.mazkiplayGenerateMultiPatch !== "function") return multiStatus("Modul AI multi-file belum siap.", true);
  button.disabled = true;
  button.textContent = "AI sedang menyusun patch…";
  $("multi-pr-summary").textContent = "AI sedang menganalisis file dan menyiapkan usulan. Periksa kuota provider.";
  try {
    const proposal = await window.mazkiplayGenerateMultiPatch({
      instruction,
      files: multiLoaded.map(file => ({ path: file.path, content: file.currentContent }))
    });
    const loadedByPath = new Map(multiLoaded.map(file => [file.path, file]));
    proposal.files.forEach(file => { loadedByPath.get(file.path).currentContent = file.updatedContent; });
    renderMultiEditors();
    $("multi-pr-summary").textContent = [
      "RINGKASAN\n" + proposal.summary,
      "LANGKAH UJI YANG DISARANKAN\n" + (proposal.tests.length ? proposal.tests.map((x, i) => (i + 1) + ". " + x).join("\n") : "Tidak dicantumkan."),
      "RISIKO / ASUMSI\n" + (proposal.risks.length ? proposal.risks.map((x, i) => (i + 1) + ". " + x).join("\n") : "Tidak dicantumkan."),
      "Editor telah diperbarui. Belum ada perubahan yang dikirim ke GitHub."
    ].join("\n\n");
    multiStatus("Usulan AI siap ditinjau untuk " + proposal.files.length + " file. Belum ada commit atau PR.");
  } catch (error) {
    $("multi-pr-summary").textContent = "";
    multiStatus("AI gagal membuat usulan: " + (error?.message || "kesalahan provider"), true);
  } finally {
    button.disabled = false;
    button.textContent = "✦ Buat usulan multi-file dengan AI";
  }
});
$("multi-pr-create").addEventListener("click", async () => {
  const button = $("multi-pr-create");
  const repo = $("github-pr-repo").value.trim();
  const base = $("github-pr-base").value.trim();
  const branch = $("multi-pr-branch").value.trim();
  const title = $("multi-pr-title").value.trim();
  const message = $("multi-pr-commit").value.trim();
  const body = $("multi-pr-body").value.trim();
  if (!validRepo(repo)) return multiStatus("Format repository harus owner/nama-repo.", true);
  if (!base || !branch || branch === base) return multiStatus("Branch patch wajib berbeda dari branch dasar.", true);
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith("/") || branch.endsWith("/") || branch.includes("..")) return multiStatus("Nama branch tidak valid.", true);
  if (!title || !message) return multiStatus("Judul PR dan pesan commit wajib diisi.", true);
  if (!multiLoaded.length) return multiStatus("Muat file terlebih dahulu.", true);
  if (multiLoaded.some(file => !safeRepoPath(file.path) || !file.currentContent.trim())) return multiStatus("Ada path atau isi file yang tidak valid.", true);
  if (rejectPotentialSecrets(multiLoaded.map(file => ({ path: file.path, content: file.currentContent })), multiStatus)) return;
  if (!confirm("Kirim " + multiLoaded.length + " file sebagai commit pada branch baru lalu buka Draft PR? Tidak ada merge otomatis.")) return;
  button.disabled = true;
  button.textContent = "Mengirim patch…";
  let branchCreated = false;
  let committed = 0;
  try {
    const ref = await requestGitHub(apiPath(repo, "/git/ref/heads/" + base.split("/").map(encodeURIComponent).join("/")));
    await requestGitHub(apiPath(repo, "/git/refs"), "POST", { ref: "refs/heads/" + branch, sha: ref.object.sha });
    branchCreated = true;
    for (const file of multiLoaded) {
      await requestGitHub(apiPath(repo, "/contents/" + filePath(file.path)), "PUT", {
        message: message + " (" + file.path + ")",
        content: encodeContent(file.currentContent),
        sha: file.sha,
        branch
      });
      committed++;
    }
    const pr = await requestGitHub(apiPath(repo, "/pulls"), "POST", {
      title,
      body: body + "\n\nUsulan multi-file dari Mazkiplay Agent Office. Harap tinjau setiap perubahan dan jalankan pengujian sebelum merge.",
      head: branch,
      base,
      draft: true
    });
    multiStatus("Draft PR #" + pr.number + " berhasil dibuat: " + pr.html_url + ". " + committed + " file di-commit; branch dasar belum di-merge.");
    const link = document.createElement("a");
    link.href = pr.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Buka Draft Pull Request #" + pr.number;
    const host = $("multi-pr-status");
    host.appendChild(document.createTextNode(" "));
    host.appendChild(link);
  } catch (error) {
    const prefix = branchCreated ? "Branch dibuat; " + committed + " dari " + multiLoaded.length + " file berhasil di-commit. " : "";
    multiStatus(prefix + (error?.message || "Gagal membuat Draft PR.") + " Periksa branch di GitHub sebelum mencoba ulang.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Buat branch + commit file + Draft PR";
  }
});
