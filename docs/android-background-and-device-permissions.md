# Android background work and device permissions

This document defines the safe implementation boundary for Mazkiplay Agent Office.

## Background execution

- Use Android WorkManager for deferrable/retryable work such as syncing queued tasks and periodic maintenance.
- Use a user-started foreground service with a persistent notification only for work that genuinely must remain active and is allowed by Android's foreground-service policy.
- Show a clear in-app toggle, explain battery/data impact, and provide a Stop action. Respect Android battery restrictions and force-stop behavior; never promise an unkillable process.
- Do not use a foreground service merely to keep the WebView alive. Actual background tasks must be implemented in native/WorkManager code with persisted, resumable inputs and observable status.
- AI inference should run in the foreground by default. A long inference/background download must have progress, cancellation, storage checks, and recovery after process death.

## Device capabilities and permissions

Android does not provide a legitimate general-purpose full device control permission. Features must use specific platform APIs and runtime permissions, and remain disabled until the user explicitly enables them.

| Capability | Allowed design |
| --- | --- |
| Notifications | Request notification permission where required; explain what will be shown. |
| Files/media | Use Android Storage Access Framework or Photo Picker; access only user-selected content. |
| Camera/microphone/location | Request just-in-time, feature-specific runtime permission and show an active state. |
| Background work | WorkManager or an eligible foreground service with persistent notification and stop control. |
| Accessibility | Only add an AccessibilityService for a clearly disclosed accessibility use case, never as a generic control or surveillance bypass. |
| Device admin, VPN, usage access, overlay | Separate opt-in flow, detailed purpose, and Android's own system confirmation; do not request by default. |
| System settings, security protections, other apps' private data | Not available to a normal app without privileged/system-level access; do not attempt to bypass OS controls. |

## Intro image-and-audio acceptance criteria

- Package android-standalone/assets/mazkiplay-intro.png and android-standalone/assets/intro-welcome.mp3 in the APK; generate the Indonesian welcome narration and short synthetic sword-like effects during CI.
- Show the intro on every cold launch; hide playback controls, allow an explicit Skip button, and continue to the app automatically when playback ends.
- If media is missing or unsupported, fail open to the app rather than trapping the user on a blank screen.
- Test audio autoplay, skip, completion, orientation, accessibility, and low-memory behavior on a physical Android device.

## Release gate

The intro asset is not considered packaged until android-standalone/assets/intro-welcome.mp3 exists in the repository and the APK workflow verifies it. Background execution is not considered complete until a real native task survives activity recreation/process death and reports its status, and the user can stop it. Do not describe these capabilities as complete based on UI alone.