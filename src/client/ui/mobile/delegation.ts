import type { WorkerInfo } from '../../../shared/protocol';
import { h, openModal, toast } from '../../ui/dom';

/** Direct a worker to create an artifact and hand it to a colleague through the real office tool. */
export function openDelegation(source: WorkerInfo, coworkers: WorkerInfo[], send: (prompt: string) => void) {
  const recipients = coworkers.filter((w) => w.id !== source.id && w.kind === 'agent' && !w.lost && !['offline', 'exited', 'needs_input'].includes(w.status));
  if (!recipients.length) return toast('Tidak ada pekerja AI lain yang siap menerima delegasi di lantai ini.', 'warn');
  const target = h('select', { 'aria-label': 'Pekerja penerima' }, ...recipients.map((w) => h('option', { value: w.id }, `${w.name} · ${w.status === 'working' || w.status === 'starting' ? 'akan menerima antrean' : 'siap'}`))) as HTMLSelectElement;
  const task = h('textarea', { rows: 5, placeholder: 'Jelaskan apa yang harus dibuat dan kriteria selesainya…', 'aria-label': 'Tugas yang akan dibuat' }) as HTMLTextAreaElement;
  const close = h('button.panel-x', { type: 'button', 'aria-label': 'Tutup', title: 'Tutup' }, '✕');
  const submit = h('button.btn.primary', { type: 'submit' }, 'Kirim tugas');
  const form = h('form.modal.delegation-modal', { role: 'dialog', 'aria-label': `Delegasikan tugas melalui ${source.name}` },
    h('header', {}, h('h2', {}, `🤝 Delegasikan lewat ${source.name}`), close),
    h('div.body', {},
      h('p', {}, 'Pilih rekan penerima dan jelaskan hasil yang perlu dibuat. Pekerja pertama akan membuat hasilnya lalu mengirimkannya kepada rekan tersebut melalui tool kantor; jika tool atau akses tidak tersedia, pekerja harus melaporkan kendala dan tidak mengaku sudah menyerahkan.'),
      h('label', {}, h('span', {}, 'Kirim hasil kepada'), target),
      h('label', {}, h('span', {}, 'Apa yang perlu dibuat?'), task),
    ),
    h('footer', {}, h('button.btn', { type: 'button', onclick: () => modal.close() }, 'Batal'), submit),
  );
  const modal = openModal(form);
  close.addEventListener('click', () => modal.close());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const work = task.value.trim();
    const recipient = recipients.find((w) => w.id === target.value);
    if (!work) return task.focus();
    if (!recipient) return toast('Pekerja penerima tidak lagi tersedia. Tutup dan coba lagi.', 'warn');
    const prompt = [
      `Buat hasil kerja berikut ini dengan lengkap: ${work}`,
      `Setelah selesai, serahkan hasil NYATA kepada pekerja ${recipient.name} (worker ID ${recipient.id}) menggunakan tool kantor agent-office tell_worker. Sertakan ringkasan, lokasi/path berkas atau output persis, dan instruksi langkah berikutnya bila ada.`,
      'Jangan mengklaim tugas selesai atau telah diserahkan kecuali pekerjaan benar-benar selesai dan tool tell_worker berhasil. Jika tool itu tidak tersedia, gagal, atau penerima tidak dapat dijangkau, jelaskan hambatan secara eksplisit dan tunjukkan hasil yang sudah dibuat tanpa mengarang keberhasilan transfer.',
    ].join('\n\n');
    modal.close();
    send(prompt);
  });
  setTimeout(() => task.focus(), 30);
}
