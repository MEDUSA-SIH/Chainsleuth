# Security Policy

This document defines how we handle security for **SIH26182, VASP Wallet Attribution**. It applies to all code, dependencies, and deployment artefacts in this repository. If you are a contributor, reviewer, or downstream deployer, read this before handling secrets, dependencies, or vulnerability reports.

## Supported versions

| Branch / Tag | Status | Receives security fixes |
|--------------|--------|-------------------------|
| `main` (latest `0.1.x`) | **Supported** | Yes. We aim to backport high and critical fixes to the latest minor on `main` |
| Older minors / archived tags | **Not supported** | No. Please upgrade to the latest `main` |

`main` is the only integration branch in this repository.

The API (`/api/v1`) is versioned separately from the internal engine. If you change a public interface, mark the commit with `BREAKING CHANGE:` and note it in `docs/contracts.md`.

## Reporting a vulnerability (private disclosure only)

**Please do not file a public GitHub issue for a suspected vulnerability.** This system handles investigator and case data, so reports stay private until there is a fix.

### How to report

1. **Open a private GitHub Security Advisory.** Go to `Security`, then `Advisories`, then `New draft advisory` on this repository. This keeps the report, the discussion, and the eventual patch private until you are ready to disclose. If you prefer direct contact, ping the team through the CODEOWNER for the affected path.
2. **Encrypt if you have our PGP key.** If you do not, plain text in the advisory is acceptable. Please do not delay the report.
3. **Include:**
   - Clear description of the issue and the affected component / file / commit.
   - Reproduction steps (PoC, curl, script, or test case).
   - Impact assessment (confidentiality / integrity / availability, who is affected).
   - Scope (which branches, chains, or deployment modes are exposed).
   - Any known mitigations or workarounds.

### What happens next

| Step | What we aim for | Owner |
|------|-----------------|-------|
| Acknowledgement | Within 2 business days | Maintainers |
| Triage and severity | Within 5 business days | Security team |
| Fix for critical or high issues | Within 7 days of triage | Maintainers |
| Fix for medium or low issues | Next scheduled minor | Maintainers |
| Coordinated disclosure and advisory | After a fix is available. We credit the reporter unless they prefer anonymity | Maintainers + reporter |

These are aims, not guarantees. A tricky issue can take longer, and we will say so in the advisory.

We follow **coordinated disclosure**: we will not disclose the issue publicly until a fix is available on `main` and, where relevant, a GitHub Security Advisory is published. We expect reporters to do the same. We provide **safe harbor** for good-faith research that follows this policy and does not exfiltrate case data, degrade services, or violate law.

## Scope

### In scope

- `api/` FastAPI service, `data/synthetic`, Docker images, GitHub Actions workflows, and `scripts/` that touch secrets or migrations.
- Authentication and authorization (JWT, RBAC, `passlib`/`bcrypt`, `python-jose`), session handling, and SAHYOG gateway integration.
- Blockchain provider adapters (they handle external input that becomes case evidence).
- PostgreSQL and Redis usage (injection, connection handling, migration safety).

### Out of scope (but still appreciated)

- Social engineering, physical access, or denial-of-service that requires physical proximity.
- Findings that require a heavily contrived local configuration far from our documented `docker compose` / `.env.example` setup, without demonstrating realistic impact.

### Current maturity note

This is evaluation software, not a hardened product. The demo stack binds to `127.0.0.1` by default. Before you expose it to a network or point it at real data, override `SECRET_KEY`, set `DEMO_MODE=false`, and supply real provider credentials. The controls below describe where things stand and where they are heading. `docs/development.md` has the current state of each area.

## Threat model (summary)

| Asset | Threat | How we handle it |
|-------|--------|------------------------------|
| LEA case data (wallets, attributions, reports) | Unauthorized read or tampering | Role checks in `app/core/security.py` plus case-scoped queries. A dedicated audit trail is future work |
| Secrets (`.env`, `SECRET_KEY`, provider API keys) | Leaks through the repo, logs, or image layers | Keep `.env` out of git, load secrets at runtime, inject them in CI rather than baking them into images, and avoid logging them (see `app/core/logging.py`) |
| Supply chain | Compromised dependency | Declare dependencies in `api/pyproject.toml`, avoid `curl | bash` in workflows, and add auditing (Dependabot, `pip-audit`) as the project matures |
| External input (addresses, chain payloads, SAHYOG messages) | Injection, SSRF, unsafe deserialization | Validate with Pydantic at every entry point (`api/app/schemas/`), keep provider output in the `CanonicalTransaction` shape, and send outbound requests through the SAHYOG adapter (`app/sahyog/gateway.py`) |
| Evidence integrity | Tampered attribution trails | Record evidence tiers and provider provenance with each result (`docs/development.md`, `api/app/db/models/`). Signed reports are future work |

For a deeper architecture view see `docs/architecture.md` and `docs/contracts.md`.

## Secure coding requirements for contributors

All contributors must follow these:

- **No secrets in source.** Never commit `.env`, tokens, or private keys. Use `.env.example` as the template; the real `.env` stays local and is injected in CI via GitHub Secrets.
- **Validate at the boundary.** Every HTTP handler, provider response, and SAHYOG payload must be validated with Pydantic before use. Do not trust raw `raw:` fields from `CanonicalTransaction`.
- **Absolute imports** inside `api` (`from app.xxx import ...`), no relative imports that obscure provenance.
- **Least privilege.** New endpoints must declare their required role; new DB queries must respect `case_id` scoping.
- **No `eval` / `exec` / `pickle` on external data.** If you need dynamic behaviour, use explicit registries (`ProviderRegistry`, `SahyogGateway`).
- **Log safely.** Use `structlog` via `app/core/logging.py`; never log `SECRET_KEY`, `DATABASE_URL`, or full payloads that contain case data. Redaction helpers are in `app/core/logging.py`.
- **Dependencies.** Add new dependencies to `api/pyproject.toml` with a lower bound (`>=`) and an upper bound when the API is unstable.

## Dependency and secrets management

- **Python dependencies:** `api/pyproject.toml` declares what the service needs. CI installs from it in a fresh runner, and the image builds from it in `api/Dockerfile`.
- **Base images:** `postgres:16-alpine`, `redis:7-alpine`, `python:3.12-slim`. Pin them by digest before any production use.
- **Scanning:** `ruff` runs in CI (`lint` job). Turn on GitHub secret scanning for your fork or deployment, and add dependency and container scanning as the project matures.
- **Rotation:** If a secret is suspected leaked, rotate it immediately in `.env` and in GitHub Secrets, and notify maintainers via the private channel above.

## Vulnerability handling checklist (for maintainers)

1. Create a **private fork / security branch** (never push the fix to a public branch before advisory).
2. Reproduce, add a regression test, and fix on that branch.
3. Bump the version in `api/pyproject.toml` and root `pyproject.toml` if the fix changes behaviour.
4. Request review from at least one other maintainer; require CI green (`lint` + `import smoke` + `pytest`).
5. Publish a **GitHub Security Advisory**, link the CVE if assigned, and credit the reporter.
6. Merge to `main`, tag it, then announce the migration steps in the team channel.

## Contact

- **Security contact:** open a private GitHub Security Advisory (see above), or ping the CODEOWNER for the affected path.
- **General questions:** open a non-security issue via `.github/ISSUE_TEMPLATE/` (bug / feature / chore).
- **LEA deployment questions:** route through the SAHYOG integration channel documented in `docs/architecture.md` Layer 8.

---

*Last reviewed: September 2026. This policy is versioned with the repository, so changes require a PR and review, just like code.*