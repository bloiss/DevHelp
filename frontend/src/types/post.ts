import type { User } from './user'

export type ContentStatus = 'pending_moderation' | 'approved' | 'flagged' | 'blocked'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  pillar?: 'dev' | 'ai'
  created_at: string
}

export interface PostImage {
  id: string
  post_id: string
  url: string
  size_bytes: number
  mime_type: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  category_id: string
  title: string
  content: string
  status: ContentStatus
  is_hidden: boolean
  created_at: string
  updated_at: string
  author: User
  category: Category
  images?: PostImage[]
  like_count?: number
  dislike_count?: number
  comment_count?: number
  user_vote?: 1 | -1 | null
  tags?: string[]
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id?: string | null
  content: string
  status: ContentStatus
  is_hidden: boolean
  created_at: string
  updated_at: string
  author: User
  like_count?: number
  dislike_count?: number
  user_vote?: 1 | -1 | null
  replies?: Comment[]
}
