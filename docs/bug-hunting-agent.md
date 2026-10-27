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