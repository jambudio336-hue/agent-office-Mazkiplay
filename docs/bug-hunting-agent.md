# Mazkiplay Pentester AI — Web Bug-Hunting Workflow

## Purpose
Provide an AI-assisted workflow for authorized security testing of websites using the user's local Termux environment. This document defines the workflow and acceptance criteria; it does not claim that the full agent-to-Termux tool loop is already implemented.

## Engagement setup
Before any network test, the user must:
1. Enter the exact base URL and verify ownership or authorization.
2. Define in-scope hostnames, paths, and APIs; explicitly list exclusions.
3. Choose a test profile and rate/time limits.
4. Confirm that the program permits the proposed testing techniques.

Targets outside the allowlist must be rejected by the orchestration layer, not merely discouraged in the prompt.

## Workflow stages
1. **Plan** — AI produces a checklist and proposed commands without executing them.
2. **Passive discovery** — collect public metadata and inspect user-provided source/configuration. Avoid state-changing requests.
3. **Baseline** — check TLS, HTTP response headers, redirects, cookie flags, robots/sitemap and publicly accessible metadata within scope.
4. **Surface mapping** — identify technologies, routes, forms and API definitions from permitted sources. Apply conservative request rate and concurrency.
5. **Focused checks** — test applicable OWASP WSTG categories, such as access control, authentication/session management, input validation, security configuration and business logic. Require additional confirmation before authenticated tests, fuzzing, payloads that change state, or high-volume requests.
6. **Evidence review** — AI reads command output and classifies each item as observation, potential finding, or verified finding. A tool banner or version match alone is not proof of a vulnerability.
7. **Report** — create a report with title, severity rationale, affected in-scope URL, prerequisites, minimal reproduction, redacted evidence, impact, remediation, and confidence.
8. **Cleanup** — stop processes, remove only artifacts created by this engagement when approved, and summarize what was tested and what was not.

## Termux command execution contract
- The model may propose commands, but only a validated tool layer can execute them.
- Show the full executable, arguments, working directory, target, timeout, and expected side effects before approval.
- Do not concatenate untrusted target input into shell strings. Prefer fixed executable paths and argument arrays; validate URLs/hostnames and resolve each destination against the engagement allowlist.
- Require an explicit confirmation for every command in the initial release. Later trusted profiles may only reduce prompts for low-risk, read-only commands if the user opts in.
- Apply a timeout, bounded output, redaction, and an execution ID to every command.
- Return stdout, stderr, exit code, start/end time, truncation status, and a clear error when Termux did not return a result.
- Support cancellation and never claim completion when the bridge only accepted a request.
- Keep an audit trail of the command and approval. Redact tokens, cookies, passwords, API keys and personal data before sending output to a remote AI provider.
- Do not automatically run destructive exploits, denial-of-service tests, credential attacks, stealth/persistence actions, data exfiltration, or scans against targets not explicitly in scope.

## Suggested initial Termux tool profiles
These are optional tools the user may install manually in Termux. Availability must be checked before use; never assume a package is installed:
- curl: low-impact HTTP baseline and response inspection.
- python: parse user-provided responses, JSON, and local artifacts.
- git: inspect repositories the user owns or is authorized to assess.
- nmap: only a specifically approved, rate-limited scan against in-scope hosts.
- OWASP ZAP: use only configured passive/baseline profiles first; active scans require separate approval and scope confirmation.

The agent must explain each proposed tool and command before execution. It must not auto-install packages without user approval.

## Implementation status
- Native Android-to-Termux command dispatch and a result receiver have been added to the Android source branch.
- Device-level bridge validation and the full chat-model → validated tool call → Termux execution → result-to-model loop remain unverified/incomplete.
- Streaming output, cancellation, robust allowlist enforcement, command policy validation, output redaction, and report export require implementation and tests before describing the agent as an autonomous bug hunter.

## Acceptance criteria
1. A prompt such as “audit this website” first requests the authorized URL and scope if absent.
2. No network command can execute before scope confirmation and explicit approval.
3. Every command is visible before it runs and can be cancelled where supported.
4. stdout, stderr, exit code and truncation are returned to the AI without fabricating missing output.
5. A fake/nonexistent tool, disconnected Termux, permission denial, timeout, and malformed result produce honest errors.
6. Findings cite concrete evidence and distinguish confirmed vulnerabilities from hypotheses.
7. Reports redact secrets and include tested/not-tested coverage.

## High-impact vulnerability coverage
The test planner should prioritize findings with potentially severe confidentiality, integrity, or availability impact, while choosing the least invasive verification method permitted by the engagement. Map checks to the current OWASP Web Security Testing Guide and OWASP Top 10; do not treat the checklist as proof that a flaw exists.

### Priority areas
- **Remote Code Execution (RCE) and command injection:** review exposed functionality that invokes operating-system commands, unsafe template/expression evaluation, and dangerous deserialization or file-processing paths. Start with source/configuration review and non-executing indicators. Do not execute arbitrary commands on a live target or establish shells; use a deliberately vulnerable local lab or a specifically approved safe proof.
- **Server-Side Request Forgery (SSRF):** inspect URL-fetching, webhook, import, preview and proxy features. Use only controlled endpoints provided for the engagement; never probe cloud metadata, internal networks or third-party destinations without explicit authorization.
- **Authentication and session compromise:** assess account recovery, session invalidation, MFA enforcement and authorization boundaries using test accounts supplied for the engagement. Never attempt credential stuffing, password spraying or use leaked credentials.
- **Broken access control / IDOR / privilege escalation:** compare access between two explicitly authorized test accounts and synthetic records; do not access or retain other users' real data.
- **SQL/NoSQL/LDAP/template injection and unsafe deserialization:** inspect input handling and error behavior with low-impact checks. Confirm exploitability in source review or a controlled test environment before escalating severity.
- **File upload, path traversal and arbitrary file read/write:** use harmless marker files and non-sensitive test fixtures; do not read secrets, overwrite production files or upload executable payloads to a live service.
- **Sensitive data exposure / cryptographic failures:** check public responses, transport security, cookie attributes, storage/configuration exposed by the application and secret handling. Never copy or transmit discovered secrets; redact them immediately.
- **Supply-chain and vulnerable components:** identify dependency versions from authorized manifests and public fingerprints, then verify advisories and applicability. A version match alone is only a lead, not confirmation.
- **Cloud/storage/API misconfiguration, security bypasses and business-logic abuse:** inspect access policies and API authorization within the declared scope; use synthetic records and reversible operations only.
- **High-impact chaining:** describe plausible chains (for example, access-control weakness plus sensitive action) as hypotheses until each link is supported by evidence.

### Severity and evidence rules
- Use CVSS as a documented aid where appropriate, alongside business impact, reachability, required privileges, user interaction, and compensating controls.
- **Critical/High labels require evidence and a written rationale.** Separate confirmed, likely, and unverified findings; include confidence and the evidence supporting each conclusion.
- Prove impact minimally. Prefer static/source analysis, staging, test fixtures, harmless canaries, and out-of-band callbacks to destructive payloads.
- Never dump databases, retrieve private files, deploy a reverse shell, persist access, disable defenses, or run denial-of-service tests as a way to prove severity.
- If a live test risks changing data, interrupting service, or crossing scope, stop and ask for explicit approval or recommend a staging reproduction.

### Report requirements for a suspected RCE
Record the affected in-scope endpoint and parameter, preconditions, relevant code/configuration or sanitized response evidence, exact safe verification method, impact rationale, confidence, and remediation. State clearly whether code execution was actually demonstrated in an authorized controlled environment; do not claim RCE from a scanner banner, stack trace, or unverified payload response alone.
