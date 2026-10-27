# Android Shell Bridge — Design and Implementation Contract

## Goal

Allow Mazkiplay Pentester AI to use a real shell on the user's own Android device through Termux, while keeping the user in control. This is a planned integration, not a claim that shell execution already exists in the APK.

## Architecture

- Android app remains the UI, agent orchestrator, permission interface, and audit-log viewer.
- Termux provides the shell environment and installed packages. The app must not pretend a terminal command ran when no bridge is connected.
- Use the supported Termux:Tasker/Termux:API command-run interface only after the user installs the required compatible Termux components and explicitly enables the bridge.
- Discover bridge availability and show a connection test before enabling execution.
- Keep command execution on-device; remote LLM providers receive only the prompt/context and tool output needed for the selected task. Never upload entire home directories by default.
- Use Android's Storage Access Framework for user-selected files and folders rather than unrestricted file access.

## Permission modes

### PLAN
- Explain steps and propose commands.
- No file writes and no command execution.

### READ_ONLY
- List/search/read only within user-selected workspace.
- Run a fixed set of non-mutating diagnostics such as tool version checks and passive metadata collection.
- Block shell commands with ambiguous or mutating effects.

### ASK_EACH_TIME
- Read/search workspace and propose edits.
- Every shell execution, file write, install, network scan, or app launch requires a visible approval showing the exact command, working directory, target, and expected impact.

### FULL_ACCESS
- User explicitly enables it for the current project/session.
- Permit file writes and shell execution only inside the selected workspace and configured command policy.
- Still require confirmation for package installation, privilege escalation, writes outside workspace, deletion, app install/uninstall, active network scans, and actions involving external targets.
- User can stop a running process and revoke access at any time.

## Tool contract

Implement each tool as a typed operation with validated arguments; never let model output bypass validation.

- `device_info`: return basic Android/Termux versions and bridge state.
- `workspace_list`, `file_read`, `file_search`: operate only in a SAF-granted workspace.
- `file_write`: require write permission and show diff before applying.
- `shell_run`: require bridge connected, enforce timeout/output limits, stream stdout/stderr/exit code, support cancellation, and record an audit event.
- `app_list`: use Android package visibility APIs and disclose the limits imposed by Android.
- `app_open`: launch only an explicitly selected installed package or an APK selected by the user; show the package and action before launching.
- `apk_analyze`: analyze user-selected APKs offline where supported; do not install or execute an APK without explicit confirmation.
- `security_scan`: run only an approved tool profile against an explicit scope allowlist.
- `report_export`: redact secrets and tokens by default.

## Scope and safety enforcement

- A network target must be entered or imported by the user and added to a per-engagement allowlist before active scanning.
- Restrict scan concurrency, request rate, runtime, and output size.
- Passive recon and local code analysis should be the default.
- Stop and ask before testing authentication, changing state, fuzzing, exploitation, or any action likely to disrupt service.
- Block destructive payloads, stealth/persistence, credential theft, data exfiltration, and scans against targets outside the configured scope.
- Log command, timestamp, working directory, target, approval state, exit status, and redacted output.
- Do not store raw API keys or secrets in logs. Never embed API keys in source code or Android assets.

## Android realities

- A normal Android app cannot silently control every other app or gain arbitrary root privileges.
- Opening another app is limited to Android intents/package visibility and user-confirmed actions.
- Reading app-private data or controlling protected system functions is not permitted without the platform's legitimate privileges.
- Termux bridge availability varies by Android version, Termux distribution, and installed add-ons. Provide a setup wizard and honest capability checks.
- On Android 13 and later, notification and background execution restrictions may affect long-running jobs; expose foreground status and cancellation.

## Acceptance tests

1. Without Termux bridge, shell tools show "not connected" and no command is falsely reported as executed.
2. PLAN and READ_ONLY modes reject file writes and mutating commands.
3. ASK_EACH_TIME displays the exact command before execution.
4. A user can cancel a long-running command and see its final exit status.
5. Attempts to traverse outside the selected workspace are rejected.
6. An out-of-scope scan target is blocked before any network request.
7. Secrets are redacted from logs and reports.
8. App launch and APK install actions show the package/file and require confirmation.
9. Tool output is displayed as raw output, with AI interpretation visually separated from evidence.
10. All permission modes and failure paths have automated tests.

## Status

A minimal native Android connection-test action is implemented in MainActivity: it sends one fixed, non-mutating echo command through Termux's com.termux.RUN_COMMAND service after the user confirms. The app declares com.termux.permission.RUN_COMMAND and package visibility for com.termux. The UI explicitly says dispatch is not proof of command completion.\n\nStill not implemented: reliable stdout/stderr and exit-code return, process identifiers/cancellation, long-running process lifecycle, general validated command execution, workspace SAF integration, and root authorization. Do not advertise full terminal/root control until those pieces and device-level tests are complete. Termux must be installed from a trusted source and its Allow external apps setting enabled.
