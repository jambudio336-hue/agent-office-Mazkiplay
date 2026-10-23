# Mazkiplay Agent Office — Self-Improvement Engine

## What is implemented in the Android standalone UI

The local-first monitor in `android-standalone/self-improvement.js`:

- records uncaught JavaScript errors and unhandled promise rejections locally;
- limits the diagnostic journal to 100 event records and coalesces identical events for 30 seconds;
- runs lightweight checks for required UI elements, local storage availability, task data shape, task errors, and a large unfinished queue;
- creates a Task Board item containing the findings and recent error context so an AI worker can analyze it;
- exports a JSON diagnostic report on explicit user action;
- never uploads logs automatically and never edits source files or installs an update.

The monitor is a diagnostic helper, not a guarantee that every bug is detected. Its local checks cannot validate all native Android behavior or prove the model is producing correct answers.

## Safe autonomy model

The long-term target is a controlled improvement loop:

1. **Observe:** collect app errors, failed task outcomes, performance signals, and user-approved feedback.
2. **Triage:** group duplicates, estimate severity, and rank issues by impact and confidence.
3. **Plan:** create a reproducible bug report and acceptance criteria.
4. **Propose:** ask the selected AI provider to prepare a patch on a separate Git branch.
5. **Verify:** run unit tests, type checks, security checks, and Android build checks. Add regression tests for every confirmed bug.
6. **Review:** create a Draft Pull Request with a diff, test evidence, risks, and rollback notes.
7. **Release:** publish a candidate build only after checks pass; keep the prior known-good build available.
8. **Learn:** retain user-approved solutions, failure patterns, and evaluation examples. Re-test the same cases after model/provider changes.

## Safety boundaries

- The app must not rewrite its own installed executable, bypass Android package signing, or silently replace its APK.
- Never execute code returned by an AI model just because it looks plausible.
- No automatic merge or production release from a self-generated patch.
- Do not include API keys, GitHub tokens, private source files, or personal data in diagnostics by default.
- Make network uploads explicit and show the user exactly what will be sent.
- Keep a stable version and rollback path; a failed health check should stop promotion.
- Treat model updates as versioned configuration changes, not proof that the model has become smarter.

## Next development stages

1. Add a reproducible test suite for the diagnostics monitor and task-board handoff.
2. Add an opt-in error-report review screen with redaction before sharing.
3. Add GitHub issue creation and Draft PR preparation behind narrowly scoped token permissions.
4. Add CI regression tests and build artifact verification, including checksums and device-install instructions.
5. Add a versioned skills/knowledge library with provenance, evaluations, and user-controlled deletion/export.
6. Add staged update notifications and manual install/rollback guidance.

## What “learn every day” can realistically mean

The application can accumulate useful user-approved notes, bug patterns, task templates, and test cases. A small on-device model does not automatically retrain itself or gain new reasoning ability merely because time passes. Better capabilities require evaluated prompt/skill updates, an improved model or provider, or new tested tools. The app should display the source, version, and evaluation status of each such upgrade.
