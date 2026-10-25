import type { WorkerInfo } from '../../../shared/protocol';
import { h, openModal } from '../../ui/dom';
import { store } from '../../state';
import './dashboard.css';

const HISTORY_KEY = 'agent-office.dashboard-history.v1';
const PROFILE_KEY = 'agent-office.employee-profile.v1';
type ChatLine = { role: 'user' | 'office'; text: string; at: number; workerId?: string };
type EmployeeProfile = { role: string; skills: string };
function load<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ } }
export function employeeProfile(workerId: string): EmployeeProfile | undefined {
  return load<Record<string, EmployeeProfile>>(PROFILE_KEY, {})[workerId];
}

export interface DashboardOptions {
  workers(): WorkerInfo[];
  /** Opens the real assignment flow and reports the chosen existing worker, if any. */
  dispatch(targetId: string | null, prompt: string, profile: EmployeeProfile, onSent: (id?: string) => void): void;
  openWorker(id: string): void;
}

/** A real task console: commands go to office workers; updates are sourced from their live status fields. */
export function openDashboardChat(opts: DashboardOptions) {
  const history = load<ChatLine[]>(HISTORY_KEY, []).slice(-50);
  const list = h('div.command-messages', { 'aria-live': 'polite', 'aria-label': 'Riwayat instruksi dan aktivitas pekerja' });
  const add = (line: ChatLine) => {
    history.push(line);
    while (history.length > 50) history.shift();
    save(HISTORY_KEY, history);
    paint();
  };
  const paint = () => {
    list.replaceChildren(...history.map((line) => {
      const card = h(`article.command-message.${line.role}`, {},
        h('p', {}, line.text), h('small', {}, `${new Date(line.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}${line.workerId ? ` · ${opts.workers().find((w) => w.id === line.workerId)?.name ?? 'Pekerja'}` : ''}`),
      );
      if (line.workerId) card.append(h('button.command-open', { type: 'button', onclick: () => opts.openWorker(line.workerId!) }, 'Buka terminal live'));
      return card;
    }));
    list.scrollTop = list.scrollHeight;
  };
  const target = h('select', { 'aria-label': 'Pilih karyawan' }) as HTMLSelectElement;
  const role = h('input', { type: 'text', maxlength: 80, placeholder: 'Jabatan, misalnya: Analis QA', 'aria-label': 'Jabatan atau posisi karyawan' }) as HTMLInputElement;
  const skills = h('input', { type: 'text', maxlength: 240, placeholder: 'Keahlian, dipisahkan koma', 'aria-label': 'Keahlian karyawan' }) as HTMLInputElement;
  const prompt = h('textarea', { rows: 3, maxlength: 6000, placeholder: 'Tulis instruksi untuk karyawan… contoh: Buat laporan, minta Anisa meninjau, lalu serahkan ke Ali untuk QA.', 'aria-label': 'Instruksi tugas' }) as HTMLTextAreaElement;
  const profileHint = h('p.command-profile-hint', {}, 'Jabatan/skill pekerja yang sudah ada disimpan di browser ini; saat rekrut, keduanya ikut dalam instruksi pertama.');
  const submit = h('button.btn.primary', { type: 'submit' }, 'Kirim instruksi');
  const close = h('button.panel-x', { type: 'button', 'aria-label': 'Tutup chat', title: 'Tutup' }, '✕');
  const form = h('form.modal.command-chat', { role: 'dialog', 'aria-label': 'Dashboard chat karyawan' },
    h('header', {}, h('div', {}, h('p.command-eyebrow', {}, 'DASHBOARD · LIVE'), h('h2', {}, 'Chat kantor'), h('p.command-subtitle', {}, 'Instruksi dikirim ke karyawan nyata. Status dan ringkasan berasal dari aktivitas kantor, bukan jawaban buatan dashboard.')), close),
    list,
    h('div.command-config', {},
      h('label', {}, h('span', {}, 'Karyawan'), target),
      h('label', {}, h('span', {}, 'Jabatan / bidang'), role),
      h('label', {}, h('span', {}, 'Skill / kemampuan'), skills),
    ),
    h('div.command-compose', {}, prompt, submit),
    h('footer', {}, profileHint, h('span.command-live-note', {}, 'Pantau terminal untuk keluaran lengkap.')),
  );
  let unsubscribe = () => {};
  const modal = openModal(form, { doing: 'mengirim instruksi melalui dashboard', closeButton: false, onClose: () => unsubscribe() });
  close.addEventListener('click', () => modal.close());

  const fillWorkers = (preserve = true) => {
    const old = preserve ? target.value : '';
    const people = opts.workers().filter((w) => w.kind === 'agent' && !w.lost);
    target.replaceChildren(h('option', { value: '' }, '✨ Tugaskan / rekrut lewat dialog'), ...people.map((w) => h('option', { value: w.id }, `${w.name} · ${w.status}`)));
    if (people.some((w) => w.id === old)) target.value = old;
  };
  const useProfile = () => {
    const profile = target.value ? employeeProfile(target.value) : undefined;
    role.value = profile?.role ?? '';
    skills.value = profile?.skills ?? '';
  };
  target.addEventListener('change', useProfile);
  fillWorkers(false);
  useProfile();
  paint();
  const last = new Map<string, string>();
  for (const w of opts.workers()) last.set(w.id, `${w.status}|${w.activity ?? ''}|${w.task?.summary ?? ''}`);
  unsubscribe = store.on('workers', () => {
    fillWorkers();
    for (const w of opts.workers()) {
      const state = `${w.status}|${w.activity ?? ''}|${w.task?.summary ?? ''}`;
      if (last.get(w.id) === state) continue;
      last.set(w.id, state);
      const useful = w.task?.summary || w.activity;
      if (useful) add({ role: 'office', text: `${w.name} · ${w.status}: ${w.task?.summary ?? w.activity}`, at: Date.now(), workerId: w.id });
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = prompt.value.trim();
    if (!text) return prompt.focus();
    const profile = { role: role.value.trim(), skills: skills.value.trim() };
    const prefix = [profile.role && `Peran karyawan: ${profile.role}.`, profile.skills && `Skill yang relevan: ${profile.skills}.`].filter(Boolean).join('\n');
    const enriched = [prefix, text].filter(Boolean).join('\n\n');
    const chosen = target.value || null;
    const who = chosen ? opts.workers().find((w) => w.id === chosen) : undefined;
    add({ role: 'user', text, at: Date.now(), workerId: chosen ?? undefined });
    prompt.value = '';
    if (chosen && who) {
      const all = load<Record<string, EmployeeProfile>>(PROFILE_KEY, {});
      if (profile.role || profile.skills) all[chosen] = profile;
      else delete all[chosen];
      save(PROFILE_KEY, all);
      opts.dispatch(chosen, enriched, profile, (id) => {
        add({ role: 'office', text: `Instruksi dikirim ke ${who.name}. Progres langsung akan muncul di dashboard; buka terminal untuk melihat keluaran lengkap atau memberi tindak lanjut.`, at: Date.now(), workerId: id ?? chosen });
      });
    } else {
      add({ role: 'office', text: 'Pilih karyawan atau rekrut pekerja baru di dialog berikutnya. Instruksi belum dikirim sampai Anda menekan tombol kirim di sana.', at: Date.now() });
      opts.dispatch(null, enriched, profile, (id) => {
        if (id && (profile.role || profile.skills)) {
          const all = load<Record<string, EmployeeProfile>>(PROFILE_KEY, {});
          all[id] = profile;
          save(PROFILE_KEY, all);
        }
        if (id) add({ role: 'office', text: `Instruksi berhasil dikirim ke ${opts.workers().find((w) => w.id === id)?.name ?? 'pekerja'}.`, at: Date.now(), workerId: id });
      });
    }
  });
}
