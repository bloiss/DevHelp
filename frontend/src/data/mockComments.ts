import type { Comment } from '@/types/post'

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      post_id: '1',
      user_id: 'u2',
      content: "C'est un comportement intentionnel de React 18. En StrictMode, React monte, démonte puis remonte les composants pour détecter les effets de bord. En production ça ne se passe qu'une seule fois. La bonne pratique c'est de retourner une fonction de cleanup dans useEffect.",
      status: 'approved',
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      vote_count: 14,
      user_vote: null,
      author: { id: 'u2', email: '', username: 'marie_js', role: 'user', email_verified: true, created_at: '', updated_at: '' },
    },
    {
      id: 'c2',
      post_id: '1',
      user_id: 'u3',
      content: "Pour compléter : si ton effet fait un appel API, tu peux utiliser un flag `let ignore = false` dans le cleanup pour ignorer la réponse du premier montage. C'est la solution recommandée dans la doc officielle React.",
      status: 'approved',
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      vote_count: 8,
      user_vote: null,
      author: { id: 'u3', email: '', username: 'thomas_w', role: 'moderator', email_verified: true, created_at: '', updated_at: '' },
    },
    {
      id: 'c3',
      post_id: '1',
      user_id: 'u4',
      content: "Merci ! Du coup si je comprends bien, la vraie solution c'est de ne pas désactiver StrictMode mais d'écrire des effets propres avec cleanup. Je vais revoir mon code dans ce sens.",
      status: 'approved',
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      vote_count: 3,
      user_vote: null,
      author: { id: 'u4', email: '', username: 'camille_r', role: 'user', email_verified: true, created_at: '', updated_at: '' },
    },
  ],
  '2': [
    {
      id: 'c4',
      post_id: '2',
      user_id: 'u1',
      content: "J'ai utilisé les deux en prod. TanStack Query gagne clairement sur les features avancées : pagination, infinite scroll, mutations avec optimistic updates, devtools... SWR c'est plus léger si t'as des besoins simples.",
      status: 'approved',
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      vote_count: 19,
      user_vote: null,
      author: { id: 'u1', email: '', username: 'alex_dev', role: 'user', email_verified: true, created_at: '', updated_at: '' },
    },
  ],
}

export function getMockComments(postId: string): Comment[] {
  return MOCK_COMMENTS[postId] ?? []
}
