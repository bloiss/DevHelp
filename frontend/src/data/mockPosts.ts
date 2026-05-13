import type { Post } from '@/types/post'

function makePost(
  id: string,
  userId: string,
  username: string,
  role: 'user' | 'moderator',
  categoryId: string,
  categoryName: string,
  categorySlug: string,
  title: string,
  content: string,
  minsAgo: number,
  votes: number,
  comments: number,
): Post {
  return {
    id,
    user_id: userId,
    category_id: categoryId,
    title,
    content,
    status: 'approved',
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
    vote_count: votes,
    comment_count: comments,
    user_vote: null,
    author: { id: userId, email: '', username, role, email_verified: true, created_at: '', updated_at: '' },
    category: { id: categoryId, name: categoryName, slug: categorySlug, created_at: '' },
  }
}

export const MOCK_POSTS: Post[] = [
  // ── React ──────────────────────────────────────────────────────────────────
  makePost('1', 'u1', 'alex_dev', 'user', 'c-react', 'React', 'react',
    "Pourquoi useEffect se déclenche deux fois en React 18 ?",
    "Depuis que je suis passé à React 18 avec StrictMode, mon useEffect s'exécute deux fois au montage. C'est normal ? Comment gérer ça proprement sans désactiver StrictMode ?",
    45, 24, 8),

  makePost('2', 'u2', 'marie_js', 'user', 'c-react', 'React', 'react',
    "TanStack Query vs SWR en 2025 — lequel choisir ?",
    "J'hésite entre TanStack Query et SWR pour mon prochain projet. Les deux semblent faire la même chose. Quelqu'un a une expérience avec les deux ?",
    180, 41, 15),

  makePost('3', 'u3', 'thomas_w', 'moderator', 'c-react', 'React', 'react',
    "Comment structurer les dossiers d'un projet React en équipe ?",
    "On démarre un nouveau projet à 3 et on n'arrive pas à s'entendre sur la structure. Feature-based ? Layer-based ? Quelqu'un a des retours d'expérience sur ce qui tient la route sur le long terme ?",
    1440, 18, 22),

  makePost('4', 'u4', 'camille_r', 'user', 'c-react', 'React', 'react',
    "Zustand ou Redux Toolkit pour une appli de taille moyenne ?",
    "Mon appli a une dizaine de slices Redux. Je trouve ça verbeux. Est-ce que migrer vers Zustand vaut vraiment le coup ou c'est juste une tendance ?",
    2880, 33, 11),

  makePost('5', 'u5', 'leo_dev42', 'user', 'c-react', 'React', 'react',
    "Gestion des erreurs dans les Server Components Next.js 14",
    "J'ai du mal à comprendre comment propager les erreurs depuis un Server Component jusqu'au client. Le fichier error.tsx ne semble pas catcher toutes les erreurs.",
    4320, 7, 3),

  // ── TypeScript ─────────────────────────────────────────────────────────────
  makePost('10', 'u2', 'marie_js', 'user', 'c-ts', 'TypeScript', 'typescript',
    "Comment typer correctement un composant générique en React + TS ?",
    "Je veux créer un composant <List<T>> générique qui accepte un tableau d'items et un renderItem. Le typage passe en local mais TypeScript se plaint dès que je l'importe ailleurs.",
    30, 19, 6),

  makePost('11', 'u6', 'nina_ts', 'user', 'c-ts', 'TypeScript', 'typescript',
    "Différence entre `type` et `interface` en TypeScript — quand utiliser lequel ?",
    "J'ai lu des dizaines d'articles contradictoires. Pour un projet React, est-ce que vous avez une règle claire sur quand utiliser type vs interface ?",
    360, 52, 20),

  makePost('12', 'u3', 'thomas_w', 'moderator', 'c-ts', 'TypeScript', 'typescript',
    "Utility types méconnus qui changent la vie",
    "On connaît tous Partial, Omit, Pick. Mais Parameters, ReturnType, Awaited, NoInfer... J'ai fait une liste des utility types que j'aurais aimé connaître plus tôt.",
    720, 87, 14),

  makePost('13', 'u7', 'sam_backend', 'user', 'c-ts', 'TypeScript', 'typescript',
    "tsconfig strict: quelles options activer en priorité pour un nouveau projet ?",
    "Je pars de zéro avec strict: true mais certaines options comme noUncheckedIndexedAccess semblent très agressives. Votre config de base recommandée ?",
    2160, 11, 7),

  // ── Python ─────────────────────────────────────────────────────────────────
  makePost('20', 'u8', 'pydev_romain', 'user', 'c-py', 'Python', 'python',
    "FastAPI vs Django REST Framework en 2025 — vrai comparatif",
    "J'ai utilisé DRF pendant 2 ans. J'envisage de passer à FastAPI pour un nouveau projet. Performances, DX, écosystème... Ce que j'ai appris après 3 mois de migration.",
    90, 38, 17),

  makePost('21', 'u9', 'data_alice', 'user', 'c-py', 'Python', 'python',
    "Gérer les dépendances Python en 2025 : pip, poetry, uv — mon retour",
    "J'ai testé les trois sur des projets réels. uv est impressionnant en vitesse mais l'écosystème est encore jeune. Poetry reste mon choix pour les projets d'équipe.",
    540, 29, 9),

  makePost('22', 'u8', 'pydev_romain', 'user', 'c-py', 'Python', 'python',
    "Async/await en Python : les pièges que personne ne te dit",
    "asyncio en Python n'est pas threading. J'ai passé deux jours à debugger un code qui bloquait l'event loop malgré les await. Voilà ce que j'ai compris.",
    1080, 44, 12),

  // ── DevOps ─────────────────────────────────────────────────────────────────
  makePost('30', 'u10', 'ops_kevin', 'user', 'c-devops', 'DevOps / CI-CD', 'devops',
    "Docker multi-stage builds : réduire l'image de 800 Mo à 45 Mo",
    "Notre image Go + Node pesait 800 Mo. Avec multi-stage et distroless comme base finale, on est à 45 Mo. Voici la recette complète.",
    120, 61, 18),

  makePost('31', 'u11', 'ci_sarah', 'moderator', 'c-devops', 'DevOps / CI-CD', 'devops',
    "GitHub Actions : cacher les dépendances node_modules efficacement",
    "Le cache actions/cache avec node_modules peut économiser 2-3 min par run. Mais les clés de cache mal configurées annulent le bénéfice. Voici ma configuration.",
    480, 27, 5),

  makePost('32', 'u10', 'ops_kevin', 'user', 'c-devops', 'DevOps / CI-CD', 'devops',
    "Kubernetes pour une petite équipe : overkill ou indispensable ?",
    "On est 4 devs avec 3 services. On nous recommande K8s partout mais j'ai l'impression que Docker Compose + un VPS suffit. Où est la vraie limite ?",
    2400, 35, 23),

  // ── IA & LLM ───────────────────────────────────────────────────────────────
  makePost('40', 'u12', 'ai_sophie', 'user', 'c-ai', 'IA & LLM', 'ai-llm',
    "RAG vs Fine-tuning : quand choisir l'un ou l'autre ?",
    "J'entends tout et son contraire. RAG pour la fraîcheur des données, fine-tuning pour le style. Mais en pratique pour une appli métier, qu'est-ce qui fait vraiment la différence ?",
    60, 73, 31),

  makePost('41', 'u13', 'llm_marc', 'user', 'c-ai', 'IA & LLM', 'ai-llm',
    "Intégrer Claude API dans une app React — erreurs courantes à éviter",
    "Après avoir monté 3 projets avec l'API Claude, voici les erreurs que je vois systématiquement : streaming mal géré, tokens non comptés, prompts pas versionnés.",
    300, 56, 22),

  makePost('42', 'u12', 'ai_sophie', 'user', 'c-ai', 'IA & LLM', 'ai-llm',
    "Prompt engineering : les techniques qui ont vraiment un impact",
    "Chain-of-thought, few-shot, self-consistency... J'ai benchmarké 6 techniques sur le même jeu de tâches. Les résultats sont surprenants.",
    900, 92, 40),

  // ── Mobile ─────────────────────────────────────────────────────────────────
  makePost('50', 'u14', 'mobile_jul', 'user', 'c-mobile', 'Mobile', 'mobile',
    "Expo SDK 52 : ce qui change vraiment pour React Native",
    "Le nouveau architecture (Fabric + JSI) est maintenant stable dans Expo. Migration depuis l'ancienne architecture : les points de friction et comment les contourner.",
    150, 34, 13),

  makePost('51', 'u15', 'swift_emma', 'user', 'c-mobile', 'Mobile', 'mobile',
    "React Native vs Flutter en 2025 pour un dev web — honest review",
    "Venant du React, j'ai testé React Native 6 mois puis Flutter 3 mois. Mon verdict honnête : DX, performances, taille de l'équipe, écosystème.",
    600, 48, 26),

  makePost('52', 'u14', 'mobile_jul', 'user', 'c-mobile', 'Mobile', 'mobile',
    "Publication sur l'App Store : le guide qu'on m'aurait aimé avoir",
    "Certificats, provisioning profiles, TestFlight, review guidelines... J'ai listé tout ce qui m'a bloqué lors de ma première soumission.",
    3600, 21, 8),

  // ── Général ────────────────────────────────────────────────────────────────
  makePost('60', 'u1', 'alex_dev', 'user', 'c-gen', 'Entraide générale', 'general',
    "Mon fetch retourne undefined la première fois — pourquoi ?",
    "J'appelle une API dans un useEffect, je stocke le résultat dans un state, mais au premier render la valeur est undefined. Ça semble basique mais je ne comprends pas le flux.",
    20, 5, 4),

  makePost('61', 'u16', 'help_lucas', 'user', 'c-gen', 'Entraide générale', 'general',
    "Git : comment annuler un commit pushé sans réécrire l'historique ?",
    "J'ai poussé un commit avec une clé API en dur. J'ai déjà révoqué la clé mais je veux nettoyer l'historique. git revert vs git reset — lequel dans mon cas ?",
    200, 16, 9),

  // ── Ressources ─────────────────────────────────────────────────────────────
  makePost('70', 'u3', 'thomas_w', 'moderator', 'c-res', 'Ressources', 'resources',
    "Liste de ressources gratuites pour apprendre le dev web en 2025",
    "J'ai compilé les meilleures ressources gratuites que j'ai utilisées cette année : vidéos, docs, challenges, newsletters. Lien vers le Notion partagé.",
    480, 104, 37),

  makePost('71', 'u9', 'data_alice', 'user', 'c-res', 'Ressources', 'resources',
    "Extensions VS Code indispensables pour le développement React/TS",
    "Ma liste personnelle : Error Lens, Pretty TypeScript Errors, Tailwind IntelliSense, GitLens... avec les configs qui font vraiment la différence.",
    1200, 67, 19),

  // ── Projets étudiants ──────────────────────────────────────────────────────
  makePost('80', 'u17', 'etu_paul', 'user', 'c-proj', 'Projets étudiants', 'projects',
    "Mon projet de fin d'études : une appli de covoiturage en Go + React",
    "Je présente mon projet de fin de BTS. Architecture microservices, auth JWT, carte Leaflet. Critiques bienvenues avant la soutenance !",
    720, 22, 15),

  // ── Carrière ───────────────────────────────────────────────────────────────
  makePost('90', 'u18', 'career_lea', 'user', 'c-career', 'Carrière & Emploi', 'career',
    "Entretien technique chez une startup — ce à quoi je ne m'attendais pas",
    "Pas de LeetCode, pas d'algo. Un vrai projet à réaliser en 2h, code review en live, discussion archi. Voici comment j'ai préparé et ce que j'ai retenu.",
    240, 58, 24),

  makePost('91', 'u19', 'job_nico', 'user', 'c-career', 'Carrière & Emploi', 'career',
    "Alternance dev web : comment trouver une entreprise qui te fait vraiment progresser ?",
    "Après 2 alternances et beaucoup de questions, j'ai identifié les signaux qui montrent qu'une entreprise va vraiment t'apprendre des choses. Thread.",
    1440, 39, 18),

  makePost('92', 'u18', 'career_lea', 'user', 'c-career', 'Carrière & Emploi', 'career',
    "Freelance à 22 ans : retour après 1 an — ce que personne ne dit",
    "Revenus, charge mentale, prospection, TJM, assurance... Mon bilan honnête après 12 mois de freelance en sortant de formation.",
    2880, 71, 33),

  // ── HTML/CSS ───────────────────────────────────────────────────────────────
  makePost('100', 'u2', 'marie_js', 'user', 'c-html', 'HTML / CSS', 'html-css',
    "CSS Grid vs Flexbox — quand utiliser lequel vraiment ?",
    "Je confonds encore parfois les deux. J'ai essayé de faire une règle simple : Grid pour les layouts 2D, Flex pour l'alignement 1D. Est-ce suffisant ?",
    350, 31, 14),

  makePost('101', 'u20', 'design_hugo', 'user', 'c-html', 'HTML / CSS', 'html-css',
    "Animations CSS performantes : transform et opacity, pourquoi seulement ces deux ?",
    "On nous dit d'utiliser uniquement transform et opacity pour les animations. J'ai essayé de comprendre le pourquoi via les DevTools — voici ce que j'ai trouvé.",
    900, 43, 11),

  // ── JavaScript ────────────────────────────────────────────────────────────
  makePost('110', 'u1', 'alex_dev', 'user', 'c-js', 'JavaScript', 'javascript',
    "Event loop en JS — enfin une explication qui fait sens",
    "J'ai longtemps fait semblant de comprendre l'event loop. Après avoir dessiné le schéma moi-même, j'ai tout compris. Je partage ma méthode.",
    600, 88, 29),

  makePost('111', 'u5', 'leo_dev42', 'user', 'c-js', 'JavaScript', 'javascript',
    "Les closures JS expliquées par un contre-exemple concret",
    "Plutôt qu'une définition théorique, voici le bug que j'ai eu dans une boucle for avec setTimeout, et comment la closure explique tout.",
    1800, 35, 10),
]

export function getMockPostsByCategory(slug: string): Post[] {
  return MOCK_POSTS.filter((p) => p.category.slug === slug)
}
