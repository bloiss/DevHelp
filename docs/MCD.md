# MCD — DevHelp Forum

> Modèle Conceptuel de Données  
> Format compatible [dbdiagram.io](https://dbdiagram.io) — colle le bloc DBML ci-dessous pour générer le diagramme visuel.

---

## Diagramme DBML

```dbml
// ─── Authentification & Utilisateurs ────────────────────────────

Table users {
  id           uuid      [pk, default: `gen_random_uuid()`]
  email        varchar   [unique, not null]
  username     varchar   [unique, not null]
  password_hash varchar  [null, note: "null si inscription OAuth"]
  avatar_url   text      [null]
  banner_url   text      [null]
  bio          text      [null]
  role         varchar   [not null, default: "user", note: "user | moderator | admin"]
  created_at   timestamp [default: `now()`]
}

Table oauth_providers {
  id           uuid      [pk]
  user_id      uuid      [ref: > users.id, not null]
  provider     varchar   [not null, note: "google | github"]
  provider_id  varchar   [not null]
  created_at   timestamp
}

Table refresh_tokens {
  id           uuid      [pk]
  user_id      uuid      [ref: > users.id, not null]
  token_hash   varchar   [not null]
  expires_at   timestamp [not null]
  created_at   timestamp
}

Table password_reset_tokens {
  id           uuid      [pk]
  user_id      uuid      [ref: > users.id, not null]
  token_hash   varchar   [not null]
  expires_at   timestamp [not null]
  used         boolean   [default: false]
  created_at   timestamp
}

// ─── Forum ───────────────────────────────────────────────────────

Table categories {
  id          uuid    [pk]
  name        varchar [not null]
  slug        varchar [unique, not null]
  description text    [null]
  pillar      varchar [not null, note: "dev | ai"]
  created_at  timestamp
}

Table posts {
  id          uuid    [pk]
  user_id     uuid    [ref: > users.id, not null]
  category_id uuid    [ref: > categories.id, not null]
  title       varchar [not null]
  content     text    [not null]
  status      varchar [not null, default: "pending_moderation", note: "pending_moderation | approved | flagged | blocked"]
  created_at  timestamp
  updated_at  timestamp
}

Table post_images {
  id       uuid    [pk]
  post_id  uuid    [ref: > posts.id, not null]
  url      text    [not null]
  size     bigint
  mime_type varchar
}

Table comments {
  id         uuid    [pk]
  post_id    uuid    [ref: > posts.id, not null]
  user_id    uuid    [ref: > users.id, not null]
  content    text    [not null]
  created_at timestamp
  updated_at timestamp
}

Table likes {
  id          uuid    [pk]
  user_id     uuid    [ref: > users.id, not null]
  target_id   uuid    [not null, note: "id du post ou commentaire"]
  target_type varchar [not null, note: "post | comment"]
  value       int     [not null, note: "+1 (like) | -1 (dislike)"]
  created_at  timestamp

  indexes {
    (user_id, target_id, target_type) [unique]
  }
}

// ─── Social ───────────────────────────────────────────────────────

Table follows {
  follower_id uuid [ref: > users.id, not null]
  following_id uuid [ref: > users.id, not null]
  created_at  timestamp

  indexes {
    (follower_id, following_id) [pk]
  }
}

// ─── Notifications ────────────────────────────────────────────────

Table notifications {
  id          uuid    [pk]
  user_id     uuid    [ref: > users.id, not null]
  type        varchar [not null, note: "comment | like | follow | message_request | message_accepted"]
  payload     jsonb   [not null, note: "{actor, post_id, post_title, post_category, conv_id}"]
  read        boolean [default: false]
  is_starred  boolean [default: false]
  is_archived boolean [default: false]
  deleted_at  timestamp [null]
  created_at  timestamp
}

Table notification_prefs {
  id               uuid    [pk]
  user_id          uuid    [ref: - users.id, unique, not null]
  push_enabled     boolean [default: true]
  notify_on_comment boolean [default: true]
  notify_on_like   boolean [default: true]
  notify_on_message boolean [default: true]
}

Table push_subscriptions {
  id         uuid    [pk]
  user_id    uuid    [ref: > users.id, not null]
  endpoint   text    [unique, not null]
  p256dh_key text    [not null]
  auth_key   text    [not null]
  created_at timestamp
}

// ─── Messagerie privée ────────────────────────────────────────────

Table conversations {
  id                uuid    [pk]
  status            varchar [not null, default: "active", note: "active | request"]
  request_sender_id uuid    [ref: > users.id, null]
  created_at        timestamp
}

Table conversation_participants {
  conversation_id uuid [ref: > conversations.id]
  user_id         uuid [ref: > users.id]

  indexes {
    (conversation_id, user_id) [pk]
  }
}

Table messages {
  id              uuid    [pk]
  conversation_id uuid    [ref: > conversations.id, not null]
  sender_id       uuid    [ref: > users.id, not null]
  content         text    [not null]
  status          varchar [not null, default: "sent", note: "sent | delivered | read"]
  attachment_url  text    [null]
  attachment_type varchar [null, note: "image | gif"]
  shared_post_id  uuid    [ref: > posts.id, null]
  is_deleted      boolean [default: false]
  created_at      timestamp
}

Table message_reads {
  message_id uuid      [ref: > messages.id]
  user_id    uuid      [ref: > users.id]
  read_at    timestamp [not null]

  indexes {
    (message_id, user_id) [pk]
  }
}

Table user_presences {
  user_id        uuid      [pk, ref: - users.id]
  last_seen      timestamp [not null]
  active_conv_id uuid      [ref: > conversations.id, null]
}

// ─── Modération ───────────────────────────────────────────────────

Table moderation_logs {
  id            uuid      [pk]
  target_id     uuid      [not null, note: "id du post ou commentaire"]
  target_type   varchar   [not null, note: "post | comment"]
  ai_verdict    varchar   [not null, note: "approved | flagged | blocked"]
  ai_reason     text      [not null]
  ai_confidence float     [null]
  reviewed_by   uuid      [ref: > users.id, null]
  final_status  varchar   [null]
  created_at    timestamp
  reviewed_at   timestamp [null]
}

Table reports {
  id          uuid      [pk]
  reporter_id uuid      [ref: > users.id, not null]
  target_id   uuid      [not null]
  target_type varchar   [not null, note: "post | comment | user"]
  reason      text      [not null]
  status      varchar   [not null, default: "pending", note: "pending | resolved | dismissed"]
  resolved_by uuid      [ref: > users.id, null]
  created_at  timestamp
  resolved_at timestamp [null]
}
```

---

## Relations résumées

| Entité | Relation | Entité |
|---|---|---|
| User | 1 → N | Post |
| User | 1 → N | Comment |
| User | 1 → N | Like |
| User | N ↔ N | User (Follow) |
| User | N ↔ N | Conversation (via participants) |
| Post | 1 → N | Comment |
| Post | 1 → N | PostImage |
| Post | 1 → N | Like |
| Conversation | 1 → N | Message |
| Message | 1 → N | MessageRead |
| User | 1 → 1 | NotificationPrefs |
| User | 1 → N | PushSubscription |
| User | 1 → N | Notification |
| Post | 1 → N | ModerationLog |

---

## Légende des statuts

| Champ | Valeurs |
|---|---|
| `users.role` | `user` · `moderator` · `admin` |
| `posts.status` | `pending_moderation` · `approved` · `flagged` · `blocked` |
| `conversations.status` | `active` · `request` |
| `messages.status` | `sent` · `delivered` · `read` |
| `likes.value` | `+1` (like) · `-1` (dislike) |
| `reports.status` | `pending` · `resolved` · `dismissed` |
| `moderation_logs.ai_verdict` | `approved` · `flagged` · `blocked` |
