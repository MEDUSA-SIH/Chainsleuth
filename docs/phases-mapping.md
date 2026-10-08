# SIH26182: Phases Mapping

The SIH26182 Technical Specification is structured in numbered "phases".
This document maps every folder in the repository to the phase(s) it
implements so new contributors can navigate the codebase without
re-reading the spec.

| Folder / File | Spec phase(s) | Notes |
|------------------------------------------------------------|----------------------------|-------|
| `api/app/main.py` | 25 (App framework) | FastAPI factory, lifespan, CORS, exception handlers |
| `api/app/config.py` | 25 | pydantic-settings, `DEMO_MODE`, `PROVIDER_*_ENABLED` toggles |
| `api/app/dependencies.py` | 25 | FastAPI Depends helpers |
| `api/app/core/security.py` | 25 | bcrypt hashing, JWT issue/verify, role dependencies |
| `api/app/core/logging.py` | 25 | structlog |
| `api/app/core/exceptions.py` | 25 | custom error types & handlers |
| `api/app/db/base.py`, `api/app/db/session.py` | 8 | Declarative base, async session factory |
| `api/app/db/models/*.py` | 8 | SQLAlchemy ORM mirroring the Phase 8 DDL |
| `api/alembic/`, `api/alembic.ini` | 8 | Migration environment |
| `api/alembic/versions/0001_initial.py` | 8 | Baseline migration declaring all Phase 8 tables |
| `api/alembic/versions/0002_auth_rbac.py` | 25 | Adds `investigators.token_version` and `password_reset_tokens` |
| `api/app/schemas/*.py` | 12, 11, 10, 17, 25 | Pydantic request/response models, including auth schemas |
| `api/app/graph/models.py`, `api/app/graph/store.py` | 6 | Node/edge types + NetworkX store |
| `api/app/graph/algorithms.py` | 6, 11 | BFS, weighted and temporal shortest paths, time-window traversal, pagerank, cluster detection |
| `api/app/providers/base.py`, `api/app/providers/canonical.py` | 9, 20 | Provider abstraction, `ProviderRegistry` + `CanonicalTransaction` |
| `api/app/providers/factory.py` | 20 | Builds the active `ProviderRegistry` from `DEMO_MODE` and per-chain toggles |
| `api/app/providers/{bitcoin,ethereum,tron,bnb}.py` | 20 | Live per-chain integrations |
| `api/app/providers/{solana,polygon}.py` | 20 | Same `BlockchainProvider` contract; upstream API bindings pending |
| `api/app/providers/demo.py` | 21, 22 | Offline demo provider over `data/synthetic/` |
| `api/app/attribution/engine.py` | 10 | Orchestrator (stages A to H) |
| `api/app/attribution/{discovery,traversal,filtering,evidence,scoring,ranking,explainability}.py` | 10 | Stage A to H implementations |
| `api/app/risk/{typology,alerts}.py` | 14 (+ REQ-020 to REQ-023) | Risk typology catalog + alert evaluation |
| `api/app/cross_chain/bridges.py` | 13 | Cross-chain bridge catalog |
| `api/app/sahyog/{gateway,models}.py` | 7 | SAHYOG adapter interface + local in-process gateway |
| `api/app/services/attribution_service.py` | 10 | Attribution orchestration over the engine |
| `api/app/services/{case,evidence,report}_service.py` | 12, 16, 17 | Service seams awaiting the Phase 12/16/17 implementations |
| `api/app/services/investigator_service.py` | 25 | Investigator CRUD, credential and token-version changes |
| `api/app/api/v1/*.py` | 25 | HTTP routers (cases, wallets, attribution, reports, auth, admin, health) |
| `api/app/workers/tasks.py` | 23 | Background task entry points |
| `api/scripts/seed_demo_data.py` | 21, 22 | Synthetic data loader |
| `api/scripts/create_investigator.py` | 25 | CLI admin bootstrap |
| `api/scripts/create_db.py` | 8 | DB bootstrap helper |
| `api/tests/` | 10 to 12, 20, 25 | 19 pytest modules covering providers, graph, attribution stages, auth |
| `data/synthetic/` | 21, 22 | Offline demo dataset (JSON fixtures, 8 cases) |
| `frontend/` | n/a | Static landing page (`index.html`, `styles.css`, `script.js`) |
| `docs/` | 26 | Architecture, contracts, development, glossary, mapping |
| `.github/` | 24, 26 | `ci` workflow, issue templates, PR template, CODEOWNERS |
| `docker-compose.yml`, `api/Dockerfile` | 24 (deployment) | Local dev stack |
| `scripts/bootstrap.sh`, `scripts/check.sh` | 24 | Convenience scripts |

## How to read this table

- **Phase 1 to 5**: Problem framing and design: captured in
 the upstream problem statement research (kept as a local reference, not committed).
- **Phase 6**: Multi-chain graph model: `api/app/graph/`.
- **Phase 7**: SAHYOG inter-agency adapter: `api/app/sahyog/`.
- **Phase 8**: Relational schema: `api/app/db/models/` + Alembic.
- **Phase 9**: Canonical transaction schema: `api/app/providers/canonical.py`.
- **Phase 10**: Attribution engine: `api/app/attribution/`.
- **Phase 11**: Graph store and wallet APIs: `api/app/graph/`,
 `api/app/api/v1/wallets.py`.
- **Phase 12**: Case management: `api/app/api/v1/cases.py`,
 `api/app/services/case_service.py`.
- **Phase 13**: Cross-chain bridges: `api/app/cross_chain/`.
- **Phase 14**: Risk typologies: `api/app/risk/`.
- **Phase 16**: Evidence packaging: `api/app/services/evidence_service.py`.
- **Phase 17**: Reporting: `api/app/services/report_service.py`,
 `api/app/api/v1/reports.py`.
- **Phase 20**: Provider abstraction: `api/app/providers/`.
- **Phase 21 to 22**: Demo mode & synthetic dataset: `api/app/providers/demo.py`,
 `api/scripts/seed_demo_data.py`, `data/synthetic/`.
- **Phase 23**: Background workers: `api/app/workers/`.
- **Phase 24**: Deployment / Docker: `docker-compose.yml`,
 `api/Dockerfile`, `Makefile`, `scripts/`.
- **Phase 25**: Application framework & security: `api/app/main.py`,
 `api/app/core/`, `api/app/api/`, `api/alembic/versions/0002_auth_rbac.py`.
- **Phase 26**: Tooling & decisions (locked tech stack): `pyproject.toml`,
 `.github/`, `docs/`, this mapping doc.

Any deviation from this mapping is recorded in `docs/architecture.md`.