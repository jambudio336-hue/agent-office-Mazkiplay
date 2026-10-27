# Mazkiplay Hacker AI — Product Roadmap

## Product objective

Turn the existing Agent Office foundation into an AI-assisted cybersecurity workbench with an Android companion. Prioritize real, verifiable security workflows over simulated "hacker" animations.

## Current verified foundation

- Existing 3D office and coding-agent worker workflow.
- Live terminal UI and agent-provider CLI integration on a host machine.
- GitHub project/issue/PR workflows.
- Mobile `/lite` dashboard through an Android WebView companion.
- Existing session and office collaboration features.

The Android app is a remote client. It does not currently run Linux security tools or AI models locally, and this rebrand does not claim otherwise.

## Planned modules

1. **Security AI Chat** — security Q&A, code explanations, triage, and defensive remediation suggestions.
2. **Scope & Authorization** — explicit target allowlist, ownership/authorization declaration, engagement notes, and action confirmation.
3. **Recon & Asset Inventory** — DNS, WHOIS, TLS certificate, HTTP headers, technology inventory, and subdomain data from permitted sources.
4. **Web Security Audit** — passive checks, configuration review, dependency checks, and OWASP-aligned findings for explicitly scoped targets.
5. **Code Audit** — secret detection, dependency risk review, insecure-pattern detection, and proposed patches in user-owned repositories.
6. **CVE Intelligence** — CVE lookup, severity/context, affected-version triage, and remediation links.
7. **Evidence & Reports** — timestamped raw output, reproducible findings, severity and confidence, remediation guidance, and Markdown/HTML/PDF export.
8. **Tool Manager** — discover installed tools, show version/availability, and run approved tools only where supported.
9. **AI Provider Settings** — user-configured providers and keys, local model options when available, usage visibility, and no embedded secrets.
10. **History & Projects** — saved sessions, engagement-specific findings, status tracking, and report comparisons.

## Safety requirements

- Only scan assets owned by the user or covered by explicit permission.
- Enforce target scope before tool execution; reject out-of-scope hosts.
- Require confirmation for active scans, file writes, destructive commands, and exploit-like actions.
- Do not implement credential theft, covert surveillance, persistence, unauthorized access, or disruptive attacks.
- Treat model-generated findings as hypotheses until validated with evidence.
- Never report simulated output as a real scan.
- Keep API keys out of source control, logs, client bundles, and exported reports.
- Prefer isolated execution environments and least-privilege credentials.

## Delivery gates

### Gate 1 — Rebrand and inventory
- Update product identity and Android launcher label.
- Inventory source modules, dependencies, workflows, and current tests.
- Confirm Android APK still points to the authenticated HTTPS `/lite` endpoint.

### Gate 2 — Reliable baseline
- Run tests, type checks, client/server builds, and Android debug build in CI.
- Fix regressions before adding new security modules.
- Publish artifacts only after a successful build; label debug APKs as test builds.

### Gate 3 — Core defensive modules
- Implement security chat, scoped project setup, code/dependency audit, CVE lookup, and evidence-backed reports.
- Add tests for scope enforcement, dangerous-command approvals, secret redaction, and error handling.

### Gate 4 — Authorized tool execution
- Add isolated tool runner, allowlisted commands, timeouts, resource limits, cancellation, audit logs, and explicit approval gates.
- Test against local lab targets and intentionally vulnerable training environments.

### Gate 5 — Release readiness
- Validate Android install/launch, server connection, login, reconnect behavior, empty/error states, accessibility, and small-screen layouts.
- Run dependency and secret scans; document supported host platforms and limitations.

## Current status

This document records the product direction and requirements. It is not a claim that the planned modules have already been implemented. The existing application code must be inspected and each module implemented, tested, and verified separately.
