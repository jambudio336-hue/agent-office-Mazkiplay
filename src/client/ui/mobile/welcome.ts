import { h } from '../../ui/dom';
import './welcome.css';

const SEEN_KEY = 'agent-office.welcome-seen.v1';

/** First-visit mobile intro. Sound starts only after a deliberate tap, as required by mobile browsers. */
export function installWelcomeIntro() {
  try {
    if (localStorage.getItem(SEEN_KEY) === '1') return;
  } catch {
    // Storage can be unavailable in private/restricted browsers; still allow the intro this visit.
  }

  const video = h('video.welcome-video', {
    src: '/welcome-intro.mp4',
    playsinline: true,
    preload: 'auto',
    'aria-label': 'Anime samurai welcome animation with Indonesian voice and sword sound',
  }) as HTMLVideoElement;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.addEventListener('error', () => {
    video.classList.add('unavailable');
    status.textContent = 'Video sambutan tidak tersedia; Anda tetap bisa masuk ke kantor.';
  });

  const status = h('p.welcome-status', { role: 'status', 'aria-live': 'polite' }, 'Tekan “Masuk dengan suara” untuk memutar sambutan.');
  let removeEscape = () => {};
  const enter = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* The overlay still closes for this visit. */ }
    overlay.remove();
    removeEscape();
  };
  video.addEventListener('ended', enter);
  const play = h('button.welcome-play', { type: 'button' }, '▶ Masuk dengan suara');
  play.addEventListener('click', async () => {
    status.textContent = 'Memutar sambutan…';
    play.disabled = true;
    video.muted = false;
    video.currentTime = 0;
    try {
      await video.play();
      window.setTimeout(enter, 5300);
    } catch {
      status.textContent = 'Pemutaran audio diblokir browser. Tekan tombol untuk mencoba lagi, atau lewati.';
      play.disabled = false;
    }
  });
  const skip = h('button.welcome-skip', { type: 'button' }, 'Lewati');
  skip.addEventListener('click', enter);
  const close = h('button.welcome-close', { type: 'button', 'aria-label': 'Tutup sambutan', title: 'Tutup' }, '✕');
  close.addEventListener('click', enter);
  const overlay = h(
    'section.welcome-overlay',
    { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Welcome to M4zK1pL4Y Agent Office' },
    video,
    h('div.welcome-shade', {}),
    h('div.welcome-content', {},
      h('p.welcome-eyebrow', {}, 'M4zK1pL4Y'),
      h('h1', {}, 'Welcome to M4zK1pL4Y Agent Office'),
      h('p.welcome-copy', {}, 'Selamat datang di kantor artificial intelejen.'),
      h('div.welcome-actions', {}, play, skip),
      status,
    ),
    close,
  );
  const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') enter(); };
  window.addEventListener('keydown', onEscape);
  removeEscape = () => window.removeEventListener('keydown', onEscape);
  document.body.append(overlay);
  skip.focus({ preventScroll: true });
}
