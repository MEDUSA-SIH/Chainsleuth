# Glossary in Plain Language

This page explains the words used in this repository in plain English. If you are new, read this before diving into the code.

---

## Project terms

| Term | Simple meaning |
|------|----------------|
| **VASP** | Virtual Asset Service Provider, a company that holds or moves crypto for users, like an exchange (e.g., an Indian or international crypto exchange). This is the final target the system tries to find. |
| **Unhosted wallet** | A wallet that no company controls, just a private key held by a person. No one to send a legal request to. |
| **Custodial / hosted wallet** | A wallet run by a VASP on behalf of a user. The VASP knows who the user is (KYC) and can act on a legal request. |
| **Deposit address** | The address a VASP gives a single user to receive money. Finding this is the main goal of the engine. |
| **Hot wallet / cold wallet** | Wallets a VASP uses to collect many users' deposits (hot = online, cold = offline storage). High-value targets for attribution. |
| **Mixer / tumbler** | A service that mixes many users' funds to hide the trail. If the trail hits a mixer, we stop, because attribution past a mixer is not trusted. |
| **Bridge** | A contract that moves value from one blockchain to another (for example, Ethereum to BNB Chain). The engine can follow the trail across chains via a bridge. |
| **SAHYOG** | The Indian inter-agency portal used to send legal disclosure or freeze requests to the correct VASP. The code has a small adapter for it (`app/sahyog/`). |
| **Attribution** | The process of linking a suspect wallet to the nearest VASP deposit that received its funds. |
| **Proximity rank** | How close a candidate wallet is to the suspect, measured in hops plus small penalties for mixer/bridge/old activity. Lower means closer. |
| **Confidence score** | 0 to 100, how much we trust a candidate. This is an equal-weight average of six baseline signals: evidence tier, label agreement, address reuse, cluster consistency, path integrity, and freshness. `high` ≥70, `medium` 40 to 69, `low` <40. Mixer hits are always `0` / `low`. The factor set is designed to be extensible, so new signals can be added without redefining the score. |
| **Evidence tier** | How strong the best evidence is: `1` is a direct deposit label (strongest), `2` is a hot-wallet cluster, `3` is a behaviour pattern, `4` is weak or heuristic, `99` is insufficient/mixer. |
| **Outcome** | The final call for a case: `single_candidate` (one clear VASP), `ranked_multi_candidate` (several VASPs), `false_candidate_filtered` (only hubs, no real VASP), `insufficient_evidence` (mixer, dead end, or nothing found). |
| **Demo mode** | When `DEMO_MODE=true` (the default), the app uses local synthetic data for all chains, so no live blockchain API keys needed. Good for development and reviews. |

---

## Code organization: 8 simple steps

The attribution engine (`api/app/attribution/`) runs 8 steps in order. Each step is a small file:

| Step | File | What it does (plain) |
|------|------|----------------------|
| **A, Discovery** | `discovery.py` | Walk the transaction graph from the suspect and collect possible end points |
| **B, Traversal** | `traversal.py` | Rebuild the full path for each candidate |
| **C, Filtering** | `filtering.py` | Remove noise: tiny transfers (dust), duplicates, or highly-connected hubs |
| **D, Evidence** | `evidence.py` | Gather supporting details for each candidate |
| **E, Proximity** | `scoring.py` | Score how close each candidate is |
| **F, Confidence** | `scoring.py` | Score how trustworthy each candidate is |
| **G, Ranking** | `ranking.py` | Sort by closeness and decide the outcome |
| **H, Explanation** | `explainability.py` | Write a plain-English explanation for each result |

Only `AttributionEngine` is public. The step files are internal, so use the engine.

---

## Chains

We support 6 chains today, all identified by a simple lowercase code:

`bitcoin`, `ethereum`, `tron`, `bnb`, `solana`, `polygon`

They appear as the `chain` field in API requests and in the transaction data. Adding a new chain means adding a new provider file, not rewriting the engine.

---

## How to write comments and commits

- **Comments:** Use plain English. Say *what* the code does and *why*. Example: `Filter out dust transfers under 0.005`.
- **Commits:** Use Conventional Commits with a clear subject anyone can understand: `feat(attribution): filter out tiny dust transfers`.

If a term here is still unclear, open an issue or ask a code owner, and please send a PR to improve this page.
