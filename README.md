# BTP — Big Tech Prep

> An open source, AI-powered interview preparation platform built by Spectroniq Limited.

BTP helps you break into big tech through personalized DSA coaching, semantic job matching, and live mock interviews — powered by Claude AI and a polyglot microservices architecture.

## Features

- **Job Hunt** — daily job scraper that searches big tech openings and ranks them semantically against your profile
- **DSA Lab** — Socratic AI coach that understands your reasoning patterns and builds your thinking, not just your answers
- **References** — DSA, system design, and interview references in one place
- **Mock Interviews** — live behavioral, technical, and system design sessions with real-time AI feedback
- **Gamification** — XP, streaks, badges, and progress heatmaps to keep you consistent

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 14, Tailwind CSS |
| Gateway | NestJS, TypeScript |
| AI Engine | Python, FastAPI, Claude API, LangChain |
| Job Scraper | Go |
| Gamification | Rust |
| Notifications | Go |
| Database | PostgreSQL + pgvector |
| Cache / Events | Redis |
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
- Rust (latest stable)

### Local Setup

```bash
# Clone
git clone https://github.com/spectroniq/btp.git
cd btp

# Install dependencies
pnpm install

# Copy env
cp .env.example .env
# Fill in your keys

# Start infrastructure
docker compose up postgres redis -d

# Start gateway
pnpm nx serve gateway

# Start web
pnpm nx dev web
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

Apache 2.0 — see [LICENSE](./LICENSE)

---

Built with by [Spectroniq Limited](https://spectroniq.vercel.app)