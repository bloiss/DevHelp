# DevHelp — Forum Dev & IA

Forum d'entraide communautaire thématisé **Développement Web** et **Intelligence Artificielle**.

## Architecture

```
DevHelp/
├── frontend/          # React SPA (Vite + TanStack + Tailwind + Shadcn)
├── backend/           # API REST principale (Go + GORM)
│   ├── cmd/api/       # Point d'entrée de l'API
│   ├── internal/      # Handlers, services, repositories, middlewares
│   └── migrations/    # Fichiers SQL de migration (goose)
├── worker/            # Worker de modération IA (Go indépendant)
├── infra/             # Config Nginx, scripts infra
├── .github/workflows/ # CI/CD GitHub Actions
├── docker-compose.yml          # Dev local (PostgreSQL, RabbitMQ, MinIO)
└── docker-compose.swarm.yml    # Production Docker Swarm avec replicas
```

## Stack technique

| Couche          | Technologie                                               |
|-----------------|-----------------------------------------------------------|
| Frontend        | React, Vite, TanStack Query+Router, Tailwind, Shadcn/ui   |
| Backend         | Go, GORM, goose (migrations), Swagger                     |
| Auth            | JWT (access 15min + refresh 7j), bcrypt, OAuth            |
| Base de données | PostgreSQL (Neon) + pgvector                              |
| Broker          | RabbitMQ (queue: `moderation.check`)                      |
| Stockage        | MinIO / AWS S3 (images ≤ 20MB)                            |
| IA              | Ollama / OpenAI / Anthropic                               |
| Infra           | Docker Swarm, Nginx                                       |
| CI/CD           | GitHub Actions (trigger: push sur `main`)                 |
| Monitoring      | Sentry (front + back, source maps)                        |

## Démarrage local

```bash
# 1. Copier les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# 2. Démarrer les services d'infrastructure
docker compose up -d

# 3. Lancer les migrations
cd backend && go run cmd/api/main.go migrate

# 4. Démarrer le backend
cd backend && go run cmd/api/main.go

# 5. Démarrer le worker
cd worker && go run cmd/main.go

# 6. Démarrer le frontend
cd frontend && npm install && npm run dev
```

## Workflow Git

- `main` : production uniquement — **aucun commit direct**
- `feat/<nom>` : une fonctionnalité = une branche
- Convention de commits : `feat:`, `fix:`, `chore:`, `docs:`
- Merge via Pull Request validée uniquement

## Liens utiles (dev local)

- Swagger API : http://localhost:8080/swagger/index.html
- RabbitMQ Management : http://localhost:15672 (guest/guest)
- MinIO Console : http://localhost:9001
