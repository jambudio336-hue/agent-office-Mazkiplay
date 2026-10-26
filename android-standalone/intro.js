/* Mazkiplay Agent Office image-and-audio startup intro.
 * Required packaged assets:
 *   android-standalone/assets/mazkiplay-intro.png
 *   android-standalone/assets/intro-welcome.mp3
 * The intro is shown on every app launch; audio is started on entry and
 * the app always falls through to the dashboard if assets are unavailable.
 */
(() => {
  const screen = document.getElementById("intro-screen");
  const audio = document.getElementById("intro-audio");
  const skip = document.getElementById("intro-skip");
  const status = document.getElementById("intro-status");
  const main = document.getElementById("app-main");
  if (!screen || !audio || !skip || !main) return;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    audio.pause();
    audio.currentTime = 0;
    screen.hidden = true;
    main.hidden = false;
  };

  screen.hidden = false;
  main.hidden = true;
  // Fail-safe: never strand the user on the intro if media events fail.
  const fallbackTimer = window.setTimeout(finish, 15000);
  skip.addEventListener("click", finish);
  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener("error", () => {
    if (status) status.textContent = "Audio intro tidak tersedia. Lanjutkan ke dashboard.";
    window.setTimeout(finish, 900);
  }, { once: true });

  const start = audio.play();
  if (start && typeof start.catch === "function") {
    start.catch(() => {
      if (status) status.textContent = "Ketuk layar atau lewati intro untuk melanjutkan.";
      screen.addEventListener("click", function unlock() {
        if (finished) return;
        audio.play().catch(() => {});
        screen.removeEventListener("click", unlock);
      }, { once: true });
    });
  }
})();
