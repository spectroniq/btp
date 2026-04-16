# Contributing to BTP

BTP is an open source project by Spectroniq Limited. We welcome contributions of all kinds.

## Project Structure

| Path | Language | Owner |
|---|---|---|
| `apps/web` | TypeScript / Next.js | Frontend |
| `apps/gateway` | TypeScript / NestJS | Backend |
| `services/ai-engine` | Python / FastAPI | ML Engineer |
| `services/job-scraper` | Go | Backend |
| `services/gamification` | Rust | Backend |
| `services/notifications` | Go | Backend |

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your keys
3. Run `docker compose up postgres redis` to start local dependencies
4. Install dependencies: `pnpm install`
5. Start the service you want to work on

## Branch Strategy

- `main` — production ready, protected
- `dev` — integration branch, all PRs target this
- `feat/your-feature-name` — feature branches

## Pull Request Process

1. Branch off `dev`
2. Keep PRs focused — one feature or fix per PR
3. Write a clear PR description — what, why, how
4. All CI checks must pass before merge
5. Request review from at least one maintainer

## Commit Convention

We use conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, config, deps
- `docs:` documentation only
- `refactor:` no behavior change

Example: `feat(ai-engine): add pgvector similarity search`

## Questions

Open a GitHub Discussion or reach out to @kingsleydaprime