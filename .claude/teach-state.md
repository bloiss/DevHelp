# Teach session state

## Meta
- date_started: 2026-05-20
- date_updated: 2026-05-20
- level: Beginner

## Project
- name: DevHelp Forum Avancé
- description: Application web de forum avec modération IA, WebSocket, messagerie privée, upload S3, Docker Swarm — stack Go + React + PostgreSQL + RabbitMQ

## KANBAN (aligné sur le Trello du projet)

### DONE ✅
- [x] Préparation & Architecture (MCD, Git, backend Go, DB hébergée)
- [x] Auth email/password (register, login, bcrypt, captcha, JWT refresh, reset password)
- [x] OAuth Google + GitHub + fusion de compte par email
- [x] CI/CD GitHub Actions (tests, build, deploy front Netlify + back Docker Hub)
- [x] Docker Compose dev + Docker Swarm prod (squelette)

### À TERMINER (Colonne 2 — vérification rapide)
- [ ] Vérifier que le Rate Limiting est bien câblé sur les routes sensibles
- [ ] Vérifier la gestion des secrets (.env non exposé)
- [ ] Tester l'ajout de mot de passe post-OAuth depuis le profil

### À FAIRE — Colonne 3 : Fonctionnalités Cœur
- [ ] **CRUD Posts** avec éditeur de texte enrichi (TipTap)
  - [ ] 3.1 Comprendre le pattern handler → service → repository en Go
  - [ ] 3.2 Écrire PostRepository (Create, GetByID, List, Update, Delete)
  - [ ] 3.3 Écrire PostService (pagination, ownership check)
  - [ ] 3.4 Écrire PostHandler (bind JSON, appeler service, répondre HTTP)
  - [ ] 3.5 Câbler les routes dans router.go
- [ ] Upload images S3/MinIO (max 20 MB)
- [ ] Système de catégories pour les posts
- [ ] Commenter, liker et disliker les contenus
- [ ] Page de profil utilisateur et historique d'activité

### À FAIRE — Colonne 4 : IA (LLM)
- [ ] Choisir un modèle LLM (OpenAI, Claude, ou Ollama)
- [ ] Bouton d'assistance IA dans l'éditeur de post
- [ ] Moteur de recherche sémantique

### À FAIRE — Colonne 5 : Modération Asynchrone (RabbitMQ & Worker)
- [ ] Conteneur Docker RabbitMQ (message broker)
- [ ] Worker Go indépendant dédié à l'analyse IA
- [ ] File d'attente pour les posts (pending → approved/flagged/blocked)
- [ ] Dataset de test + tests d'intégration IA
- [ ] Dashboard admin (modération, catégories, utilisateurs, signalements)

### À FAIRE — Colonne 6 : Temps Réel & Notifications
- [ ] WebSocket pour messagerie privée
- [ ] Historique des conversations en DB
- [ ] Notifications temps réel (likes, commentaires)
- [ ] Notifications Web Push (Service Worker)

### À FAIRE — Colonne 7 : DevOps, Déploiement & Tests
- [ ] docker-compose.yml compatible Docker Swarm (scaling demo)
- [ ] Sentry en production (source maps)
- [ ] Stress test RabbitMQ (k6 ou Artillery)

### À FAIRE — Colonne 8 : Préparation des Oraux
- [ ] Documentation Swagger
- [ ] Soutenance technique (termes précis, démo scaling)

## Progress
- current_task: CRUD Posts (Colonne 3)
- current_substep: 3.1 — Comprendre le pattern handler → service → repository en Go
- attempt_count: 0

## Recap
(vide — mis à jour après chaque sous-étape validée)
