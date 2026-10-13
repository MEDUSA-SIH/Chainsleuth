# Contributing to SIH26182

Welcome! This document explains how the team collaborates on the
**SIH26182, VASP Wallet Attribution** codebase. The goal is to make it
easy for multiple developers to work in parallel without stepping on
each other.

---

## 1. Branching model

| Branch          | Purpose                                                  |
|-----------------|----------------------------------------------------------|
| `main`          | Stable. This is the default branch, and all PRs target `main`. PR only. |
| `feature/<x>`   | New functionality. Branched from `main`.                |
| `fix/<issue>`   | Bug fixes. Branched from `main`.                         |
| `chore/<x>`     | Tooling, docs, refactors with no behaviour change.       |
| `release/<v>`   | Release prep (version bumps, changelog). From `main`.   |
| `hotfix/<x>`    | Emergency fix to `main`.                                  |

> **Note:** there is no `develop` branch in this repo. Older revisions of
> this document mentioned one, so ignore them. `main` is the only
> integration branch.

> **Naming convention:**
> - `feature/<short-kebab-name>`, e.g. `feature/eth-provider-live`
> - `fix/<issue-number>-<short-desc>`, e.g. `fix/142-attribution-stuck`
> - `chore/<short-desc>`, e.g. `chore/update-ruff`

> **Branch protection (recommended GitHub settings):**
> - `main`: require pull request reviews, dismiss stale
>   approvals on push, require status checks from the `ci` workflow,
>   require linear history.
> - Direct pushes to `main` are forbidden.

---

## 2. Workflow

1. Make sure your `main` is up to date:
   ```bash
   git fetch origin
   git checkout main
   git pull --ff-only origin main
   ```
2. Create your branch:
   ```bash
   git checkout -b feature/<short-name>
   ```
3. Work in small, focused commits (Conventional Commits below).
4. Push and open a Pull Request **into `main`**:
   ```bash
   git push -u origin feature/<short-name>
   gh pr create --base main --head feature/<short-name>
   ```
5. Wait for CI to pass, request review from at least one teammate, address
   feedback, then merge (squash by default).
6. After review approval, squash-merge into `main` and delete your branch.

---

## 3. Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
spec. Every commit message looks like:

```
<type>(<scope>)<!>: <short summary>

<body explaining motivation and trade-offs>

<footer with issue / BREAKING CHANGE markers>
```

| Type       | Use for                                                  |
|------------|----------------------------------------------------------|
| `feat`     | New user-facing feature                                  |
| `fix`      | Bug fix                                                  |
| `docs`     | Docs only                                                |
| `style`    | Formatting / lint-only changes                           |
| `refactor` | Code change with no behaviour change                     |
| `test`     | Adding or fixing tests                                   |
| `chore`    | Tooling, build, CI                                       |
| `perf`     | Performance improvement                                  |

Examples (already used in this repo):
- `feat: initial monorepo scaffold for SIH26182 VASP attribution system`
- `chore: add team collaboration base (CI, pre-commit, docs)`

---

## 4. Pull Request checklist

Every PR must:

- [ ] Have a descriptive title following the commit convention
- [ ] Reference a GitHub issue (`Closes #123`) when one exists
- [ ] Be **squash-merged** (keeps history tidy)
- [ ] Pass `ci` (lint + import smoke + tests)
- [ ] Update docs if behaviour changed (`docs/*.md`)
- [ ] Keep the PR focused on one area of the codebase
- [ ] Get approval from the path CODEOWNER before touching files outside that area

> Use `.github/PULL_REQUEST_TEMPLATE.md`, which fills in the checklist
> automatically.

---

## 5. Local development setup

```bash
git clone <repo-url>
cd Chainsleuth
./scripts/bootstrap.sh
```

That script:

1. Copies `.env.example` to `.env` (if missing).
2. Pulls base Docker images.
3. Starts the stack via `docker compose up -d --build`.
4. Waits for `/api/v1/health` to respond.

Optional one-time setup:

```bash
pip install pre-commit
pre-commit install
```

Now `ruff` and the other hooks will fire on every commit.

---

## 6. Daily commands

| Task                        | Command                |
|-----------------------------|------------------------|
| Bring stack up              | `make up`              |
| Tail api logs               | `make logs`            |
| Open api shell              | `make shell`           |
| Apply DB migrations         | `make migrate`         |
| Run tests                   | `make test`            |
| Run linter locally          | `make lint`            |
| Auto-format                 | `make format`          |
| Generate migration          | `make revision m="..."`|
| Run quick sanity checks     | `make check`           |

---

## 7. Code style

- **Python 3.12** (target). Ruff + `ruff format` is the source of truth.
- **Absolute imports** inside `api` (`from app.xxx import ...`).
- **Docstrings** should say what the code does and which area it belongs to.
- **No secrets** in source. Use `.env`, never commit it.
- **Tests** live in `api/tests/`. Mirror the module structure.
- **Public interfaces** (see `docs/contracts.md`) must not change without
  a `BREAKING CHANGE:` footer in the commit AND a heads-up in the team channel.

---

## 8. Code ownership

`.github/CODEOWNERS` lists the owning team for each path. The listed owners are auto-requested as reviewers when a PR touches their files. If your change spans multiple owned areas, talk to each owner first, or split the work into one PR per area.

---

## 9. Reporting issues

Use the appropriate issue template in `.github/ISSUE_TEMPLATE/`:

- `bug.md`: something is broken.
- `feature.md`: new functionality proposal.
- `chore.md`: tooling, deps, refactor.

---

## 10. Getting help

- The team chat channel.
- Open a `question.md` issue.
- Ping a CODEOWNER (`.github/CODEOWNERS`).