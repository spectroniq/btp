# BTP — Big Tech Prep

> An open source, AI-powered interview preparation platform built by Spectroniq Limited.

BTP helps you break into big tech through personalized DSA coaching, semantic job matching, and live mock interviews — powered by Claude AI and a polyglot microservices architecture.

## Features

- **Job Hunt** — daily job scraper that searches big tech openings and ranks them semantically against your profile
- **DSA Lab** — Socratic AI coach that understands your reasoning patterns and builds your thinking, not just your answers
- **Mock Interviews** — behavioral, technical, and system design sessions in three modes: standard AI coaching, cold-recruiter simulation, and AI-native (AI use allowed, 5-dimension scorecard)
- **References** — DSA, system design, and interview references in one place
- **Gamification** — XP, streaks, badges, and progress heatmaps *(coming in v1.1)*

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 16, Tailwind CSS |
| Gateway | NestJS, TypeScript, Prisma |
| AI Engine | Python, FastAPI, Claude API |
| Job Scraper | Go |
| Gamification | Rust *(coming in v1.1)* |
| Notifications | Go, Resend |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| Monorepo | Nx + pnpm |
| Infra | Docker, Kubernetes, Terraform |
| CI/CD | GitHub Actions + Nx Cloud |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker + Docker Compose
- Go 1.23+
- Python 3.12+ + uv

### Local Setup

```bash
# Clone
git clone https://github.com/spectroniq/btp.git
cd btp

# Install dependencies
pnpm install

# Copy env and fill in your keys
cp .env.example .env

# Start all services (recommended)
docker compose -f docker-compose.dev.yml up
```

Or start services individually:

```bash
# Infrastructure only
docker compose up postgres redis -d

# Gateway
pnpm nx serve gateway

# Web
pnpm nx serve web

# AI engine
cd apps/ai-engine && uv run uvicorn main:app --reload
```

### Required environment variables

| Variable | Purpose |
|---|---|
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth |
| `ANTHROPIC_API_KEY` | AI engine |
| `VOYAGE_API_KEY` | Semantic embeddings |
| `SERPAPI_KEY` | Job scraper *(optional — scraper disabled without it)* |
| `RESEND_API_KEY` | Email notifications *(optional)* |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

Apache 2.0 — see [LICENSE](./LICENSE)

---

Built with ♥ by [Spectroniq Limited](https://spectroniqlimited.com)
