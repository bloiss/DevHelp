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
| Backend         | Go, GORM, Swagger                                         |
| Auth            | JWT (access 15min + refresh 7j), bcrypt, OAuth            |
| Base de données | PostgreSQL (Neon) + pgvector                              |
| Broker          | RabbitMQ (queue: `moderation.check`)                      |
| Stockage        | MinIO / AWS S3 (images ≤ 20MB)                            |
| IA              | Ollama / OpenAI / Anthropic                               |
| Infra           | Docker Swarm, Nginx                                       |
| CI/CD           | GitHub Actions (trigger: push sur `main`)                 |
| Monitoring      | Sentry (front + back, source maps)                        |

---

## Services externes — guide de démarrage

### PostgreSQL (base de données)

Le projet utilise [Neon](https://neon.tech) en production et développement. Aucune installation locale nécessaire : la `DATABASE_URL` dans `.env` pointe directement vers Neon.

Si tu veux une base locale à la place :
```bash
docker compose up postgres -d
# puis mettre DATABASE_URL=postgresql://devhelp:devhelp@localhost:5432/devhelp dans .env
```

---

### MinIO (stockage d'images)

MinIO est un serveur de stockage compatible S3. Il stocke les images uploadées dans les posts.

**Démarrage via Homebrew (sans Docker) :**
```bash
# Installation (une seule fois)
brew install minio/stable/minio

# Démarrage
minio server /tmp/minio-data --address ":9000" --console-address ":9001"
```

**Démarrage via Docker :**
```bash
docker compose up minio -d
```

**Accès :**
- API S3 : http://localhost:9000
- Console web : http://localhost:9001 → login `minioadmin` / `minioadmin`

**Variables `.env` nécessaires :**
```
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=devhelp
```

> Si MinIO n'est pas démarré, l'API démarre quand même mais l'upload d'images est désactivé.

---

### RabbitMQ (broker de messages)

RabbitMQ est une **file d'attente de messages** entre l'API et le worker de modération.

**Rôle dans DevHelp :**
Quand un utilisateur crée un post ou un commentaire, l'API le sauvegarde en base puis dépose un message dans la queue RabbitMQ. Le worker lit cette queue, appelle l'IA pour analyser le contenu, et met à jour le statut (`pending_moderation` → `approved` / `flagged` / `blocked`). Cela permet à l'API de répondre immédiatement à l'utilisateur sans attendre l'IA.

**Démarrage via Docker :**
```bash
docker compose up rabbitmq -d
```

**Démarrage via Homebrew (sans Docker) :**
```bash
# Installation (une seule fois)
brew install rabbitmq

# Démarrage
brew services start rabbitmq
```

**Accès :**
- AMQP (connexion applicative) : `amqp://localhost:5672`
- Interface web de monitoring : http://localhost:15672 → login `guest` / `guest`

**Variables `.env` nécessaires :**
```
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_MODERATION_QUEUE=moderation.check
```

> Si RabbitMQ n'est pas démarré, l'API démarre quand même mais la modération automatique est désactivée (les contenus restent en `pending_moderation`).

---

### Ollama (IA locale)

Ollama fait tourner un modèle de langage (LLM) directement sur ta machine, sans clé API.

**Installation :**
```bash
# Télécharger et installer depuis https://ollama.com
# ou via Homebrew :
brew install ollama
```

**Démarrage et téléchargement du modèle :**
```bash
ollama serve                  # démarre le serveur (port 11434)
ollama pull llama3.2          # télécharge le modèle (~2GB)
```

**Variables `.env` nécessaires :**
```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

**Alternative avec OpenAI :**
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

> Si aucun provider IA n'est disponible, le worker log l'erreur dans `moderation_logs` et le contenu reste en `pending_moderation`. L'API n'est pas affectée.

---

## Démarrage complet (développement)

### Option 1 — Makefile (recommandé)

```bash
# 1. Copier et remplir les variables d'environnement
cp .env.example .env

# 2. Démarrer RabbitMQ (nécessaire pour la modération)
docker compose up rabbitmq -d

# 3. Démarrer MinIO + API + Frontend en une commande
make dev

# 4. Démarrer le worker de modération (dans un autre terminal)
make worker

# Arrêter tout
make stop
```

**Logs en temps réel :**
```bash
make logs-api
make logs-worker
make logs-front
make logs-minio
```

### Option 2 — Manuel (sans Makefile)

```bash
# Terminal 1 — RabbitMQ
docker compose up rabbitmq -d

# Terminal 2 — MinIO
minio server /tmp/minio-data --address ":9000" --console-address ":9001"

# Terminal 3 — API
cd backend && go run ./cmd/api/main.go

# Terminal 4 — Worker
cd worker && go run ./cmd

# Terminal 5 — Frontend
cd frontend && npm install && npm run dev
```

---

## Workflow Git

- `main` : production uniquement — **aucun commit direct**
- `feat/<nom>` : une fonctionnalité = une branche
- Convention de commits : `feat:`, `fix:`, `chore:`, `docs:`
- Merge via Pull Request validée uniquement

---

## Liens utiles (dev local)

| Service | URL | Identifiants |
|---|---|---|
| Frontend | http://localhost:5173 | — |
| API | http://localhost:8080 | — |
| Swagger | http://localhost:8080/swagger/index.html | — |
| RabbitMQ UI | http://localhost:15672 | guest / guest |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Ollama | http://localhost:11434 | — |
