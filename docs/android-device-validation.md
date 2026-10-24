# Android device validation — Mazkiplay Agent Office

Use this checklist on a real Android device before promoting a build as stable. A successful CI build proves the APK can be built and the automated checks passed; it does not prove native inference, device compatibility, or every user flow works.

## Test record

Record the APK release tag, Git commit SHA, Android version, device model, available storage, and whether each check passed, failed, or was not tested. Never attach API keys, GitHub tokens, private conversations, or unredacted logs to a report.

## Install and launch

- [ ] Download the APK from the project's official GitHub Releases page and verify its SHA-256 against the release checksum file.
- [ ] Install on a supported Android device (Android 7.0 / API 24 or newer).
- [ ] Launch, close, and relaunch the app; verify no blank screen, crash loop, or lost essential settings.
- [ ] Check portrait layout, keyboard visibility, small-screen layout, and reduced-motion behavior where available.
- [ ] Confirm the app explains missing permissions, network failures, and insufficient storage instead of showing a false success state.

## Local AI mode

- [ ] Confirm the UI identifies local mode and explains that the first model download requires internet.
- [ ] Start a model download on a stable network; verify progress advances and cancellation/reset behaves safely.
- [ ] Interrupt the download (for example, enable airplane mode) and confirm the partial file is not presented as a ready model.
- [ ] Resume or restart the download and verify the model reaches a ready state only after validation.
- [ ] Send a simple prompt after model activation and confirm a generated answer appears, rather than a canned fallback being mislabeled as generative AI.
- [ ] Enable airplane mode after the model is ready, restart the app, and test local inference again.
- [ ] Observe memory use, heat, latency, and app stability during several prompts. Record failures without personal or secret data.

## API mode and credentials

- [ ] Configure a supported provider only when intentionally testing API mode; verify an invalid key produces a clear error.
- [ ] Verify provider/model selection is respected and that network failure does not claim a response succeeded.
- [ ] Confirm secrets do not appear in ordinary localStorage app records, exported diagnostics, task text, or visible error messages.
- [ ] Confirm changing modes does not silently send local-mode prompts to a remote provider.

## Diagnostics and recovery

- [ ] Trigger the built-in health check and inspect its findings.
- [ ] Export a diagnostic report using dummy test credentials only; inspect the file before sharing.
- [ ] Verify common test patterns such as `ghp_TESTTOKEN012345678901234567890`, `Bearer test-secret-token-value`, and `api_key=sample-secret-value` are redacted wherever the redaction helper applies.
- [ ] Clear the error journal and verify learning notes and improvement proposals are retained if the UI says they should be.
- [ ] Reboot the device and confirm the app returns to a usable state.

## Release gate

Do not call a release device-verified until the local model has generated a real answer on a physical device and the offline test has passed. If a check fails, record steps to reproduce, expected versus actual behavior, app/build version, and a redacted diagnostic report. Fix it on a separate branch, add a regression test, rerun CI, and retain a known-good release for rollback.
