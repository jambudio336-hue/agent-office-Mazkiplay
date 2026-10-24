/* Mazkiplay Agent Office startup intro.
 * Asset path: android-standalone/assets/intro.mp4 (video includes its original audio).
 * The intro is shown on every app launch when the asset is packaged. Users may skip,
 * but the video has no pause/stop controls. Missing/unsupported media must never trap
 * the user on a blank screen.
 */
const screen = document.getElementById("intro-screen");
const video = document.getElementById("intro-video");
const skip = document.getElementById("intro-skip");
const status = document.getElementById("intro-status");

if (screen && video && skip) {
  let leaving = false;
  const finish = () => {
    if (leaving) return;
    leaving = true;
    video.pause();
    video.removeAttribute("src");
    video.load();
    screen.hidden = true;
  };
  skip.addEventListener("click", finish);
  video.addEventListener("ended", finish, { once: true });
  video.addEventListener("error", finish, { once: true });
  video.addEventListener("pause", () => {
    if (!leaving && !video.ended && !screen.hidden) {
      // No pause button is exposed; resume if WebView/system pauses unexpectedly.
      const resumed = video.play();
      if (resumed && typeof resumed.catch === "function") {
        resumed.catch(() => {
          if (status) status.textContent = "Pemutaran dijeda oleh sistem. Kamu bisa melewati intro.";
        });
      }
    }
  });
  video.addEventListener("playing", () => {
    if (status) status.textContent = "Video pembuka · audio aktif";
  });
  video.addEventListener("loadedmetadata", () => {
    if (status) status.textContent = "Video pembuka sedang diputar…";
  });
  video.src = "./assets/intro.mp4";
  screen.hidden = false;
  video.muted = false;
  video.controls = false;
  video.playsInline = true;
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {
      if (status) status.textContent = "Audio/video menunggu izin pemutaran WebView. Kamu bisa melewati intro.";
    });
  }
}
