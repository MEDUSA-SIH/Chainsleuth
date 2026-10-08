# Chainsleuth: Repository Structure

Map of where everything lives, who owns it, and where new code goes.
Companion to [`architecture.md`](architecture.md) (system design). File ownership is declared in `.github/CODEOWNERS`.

> **Maintenance note:** the file and module counts below are verified against the
> `main` branch. If you add or remove a module, update this file in the same commit.
> A stale count here is worse than no count.

## Principles

1. **One deployable.** Only `api/` ships. Everything else is data, docs, or static assets.
2. **Frozen contracts.** Public interfaces in `docs/contracts.md` are stable. Breaking changes need a `BREAKING CHANGE:` footer.
3. **One concern per branch.** Keep each branch focused on one area. Changes that span owned areas need approval from each path CODEOWNER (`CODEOWNERS`).
4. **Engine has one door.** `AttributionEngine.run` is the only public entry. Stage modules (`discovery`…`explainability`) are private.
5. **Local stays local.** Anything under `.private/` or `.sih/` never enters git. `.gitignore` lists the directories, never filenames.

## Top level

| Path | Purpose | Ships? | Owner |
|------|---------|--------|-------|
| `api/` | FastAPI service, migrations, tests | ✅ deployable | WP-01, WP-28, WP-35 |
| `data/synthetic/` | Offline demo dataset, 6 JSON files holding 8 synthetic cases | ✅ fixtures committed | WP-11 |
| `docs/` | Architecture, contracts, phases, WPs, glossary, repo map, media | no | WP-02 |
| `frontend/` | VASPTrace landing page (static, no build) | static | landing |
| `scripts/` | `bootstrap.sh`, `check.sh` | no | WP-02 |
| `.github/` | CI, templates, CODEOWNERS, ruleset | no | WP-02 |
| `docker-compose.yml` | postgres 16 + redis 7 + api | local dev | WP-01 |
| `Makefile` | `up/down/logs/migrate/test/lint/format/check/seed-demo` | no | WP-01 |
| `.env.example` | Environment template (only this is versioned) | no | WP-01 |

`.private/` and `.sih/` are local-only working directories. They are git-ignored as
whole directories and are absent from a fresh clone, so create them with `mkdir -p`
if you need them. Neither is required to build, test, or run the API.

## `api/` deep dive

```
api/
├── app/
│   ├── main.py               # lifespan, router wiring
│   ├── config.py             # pydantic-settings (Phase 25)
│   ├── dependencies.py       # SessionDep, CurrentInvestigatorDep, ProviderRegistryDep
│   ├── api/v1/               # 9 files: __init__ + 8 routers
│   │   ├── health.py         # GET /health
│   │   ├── auth.py           # login/logout/me/change-password/reset (WP-28)
│   │   ├── cases.py          # case CRUD endpoints
│   │   ├── wallets.py        # wallet/graph queries
│   │   ├── attribution.py    # POST /attribution/run (smoke endpoint)
│   │   ├── reports.py        # POST /reports/generate
│   │   ├── admin.py          # settings echo
│   │   └── admin_investigators.py  # admin CRUD + RBAC (WP-28)
│   ├── attribution/          # 10 files: engine.py (public) + 8 stages + types
│   ├── core/                 # 4 files: security (JWT/bcrypt/RBAC), logging, exceptions, __init__
│   ├── cross_chain/          # 2 files: bridge catalogue (Phase 13)
│   ├── db/                   # 20 files: base, session, models/* (17 models). Migrations live in alembic/
│   ├── graph/                # 4 files: models, store, algorithms (WP-19), __init__
│   ├── providers/            # 11 files: base ABC + factory + canonical + 8 chains
│   ├── risk/                 # 3 files: typology catalogue + alerts (Phase 14)
│   ├── sahyog/               # 3 files: gateway ABC + implementation + models (Phase 7)
│   ├── schemas/              # 7 files: attribution, auth, case, common, report, wallet
│   ├── services/             # 6 files: attribution, case, evidence, investigator, report
│   └── workers/              # 2 files: background tasks (Phase 23)
├── alembic/                  # 0001_initial, 0002_auth_rbac
├── scripts/                  # seed_demo_data, create_investigator, create_db (+ READMEs)
├── tests/                    # 24 files, 163 test functions (see below)
├── Dockerfile                # multi-stage, non-root, HEALTHCHECK on /api/v1/health
└── pyproject.toml            # hatchling service deps
```

### Module responsibilities

| Module | Files | Responsibility | Phase / WP |
|--------|-------|----------------|------------|
| `api/v1/` | 9 | HTTP surface only. Validate, call the service, return | 25 / per-WP |
| `attribution/` | 10 | 8-stage pipeline; `engine.py` is the only import outsiders use | 10 / WP-35 |
| `providers/` | 11 | `base.py` ABC + `factory.py` + `canonical.py`; per-chain adapters for BTC/ETH/TRON/BNB/SOL/POL plus the local dataset provider | 20 to 22 / WP-03 to WP-08, WP-11 |
| `graph/` | 4 | NetworkX store + community/page-rank/time-window algos | 6, 11 / WP-19 |
| `db/` | 20 | SQLAlchemy models + session; migrations live in `alembic/` | 8 / WP-01 |
| `sahyog/` | 3 | Gateway ABC + in-process implementation | 7 / WP-23 |
| `services/` | 6 | Orchestration (no HTTP, no SQL in routers) | 12, 17, 25 |
| `schemas/` | 7 | Pydantic wire shapes | per-WP |
| `core/` | 4 | Settings, JWT/bcrypt/RBAC, logging, typed errors | 25 / WP-28 |
| `risk/` + `cross_chain/` | 5 | Typologies, alerts, bridge catalogue | 13, 14 |

## Where new code goes

| Task | Location | Test | WP |
|------|----------|------|----|
| New chain adapter | `api/app/providers/<chain>.py` + toggle in `.env.example` + factory | `api/tests/unit/test_<chain>_provider.py` | WP-07/08 style |
| New DB table | `api/app/db/models/<thing>.py` + `make revision m="…"` | `api/tests/unit/test_models.py` | owning WP |
| New endpoint | router in `api/app/api/v1/` + logic in `services/` + schema in `schemas/` | `api/tests/integration/test_<area>_api.py` | owning WP |
| New attribution signal | `attribution/scoring.py` or `evidence.py` (never in router) | `test_attribution_stages.py` + smoke | WP-35 follow-up |
| New docs | `docs/<topic>.md` + link from `README.md` Documentation Map | none needed | WP-02 |

Anti-patterns: importing stage modules directly (use `AttributionEngine`), putting SQL in routers (use `services/`), committing `.env` or anything under `.private/`, adding chain URLs in code (env only).

## Tests

`api/tests/` holds 24 Python files, 19 of them test modules, with 163 test functions:

- `unit/` (14 files): stages, demo dataset/provider, factory, BTC/ETH/TRON/BNB providers, graph, auth schemas, security, models, health, providers.
- `integration/` (5 files + conftest): 8-case smoke, auth API, investigator service, live ETH RPC + graph, seed script.

Run: `make test` (container) or `uv run pytest api/tests -q` (local). Gate: `make check` (ruff + import smoke).

## Data, docs, frontend, tooling

- `data/synthetic/` has 6 JSON files holding 8 synthetic cases, plus `README.md` (all committed). CSV/parquet bulk sets stay local (git-ignored).
- `docs/` holds `architecture.md` (layered design), `contracts.md` (frozen), `development.md` (daily workflow), `phases-mapping.md` (folder to phase), `glossary.md` (terms), `repo-structure.md` (this file), `media/` (project film).
- `frontend/` holds `index.html`, `styles.css`, and `script.js`. Static VASPTrace landing, no build step.
- `scripts/`, `Makefile`, and `.github/` hold bootstrap, checks, shortcuts, and CI (lint · import smoke · pytest on postgres 16 + redis 7).
- `.private/` and `.sih/` hold renders, review drops, vendor bundles, tool caches, and submission drafts. Both git-ignored as whole directories. Create with `mkdir -p`. Never required to build/test/run.
