export interface TagDef {
  label: string
  className: string
}

export const TAG_DEFINITIONS: Record<string, TagDef> = {
  react:       { label: 'React',       className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  javascript:  { label: 'JavaScript',  className: 'bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/25' },
  typescript:  { label: 'TypeScript',  className: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/20' },
  css:         { label: 'CSS',         className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  golang:      { label: 'Go',          className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  python:      { label: 'Python',      className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  devops:      { label: 'DevOps',      className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  databases:   { label: 'SQL',         className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  security:    { label: 'Sécurité',    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  'ai-llm':    { label: 'IA / LLM',    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  'html-css':  { label: 'HTML/CSS',    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  bug:         { label: 'Bug',         className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  question:    { label: 'Question',    className: 'bg-orange-400/10 text-orange-600 dark:text-orange-400 border-orange-400/20' },
  aide:        { label: 'Aide',        className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  resolu:      { label: '✓ Résolu',    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  urgent:      { label: '⚡ Urgent',   className: 'bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20' },
  performance: { label: 'Perf',        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
}

export function inferTags(categorySlug: string, title: string): string[] {
  const tags: string[] = []
  const t = title.toLowerCase()

  if (TAG_DEFINITIONS[categorySlug]) tags.push(categorySlug)

  if (/\bbug\b|erreur|error|crash|ne\s+fonctionne\s+pas|bloqué/.test(t)) tags.push('bug')
  else if (/urgent|asap/.test(t)) tags.push('urgent')
  else if (/résolu|solved|solution|fixed/.test(t)) tags.push('resolu')
  else if (/comment\s|pourquoi\s|qu'est|c'est\s+quoi|quel\s+est/.test(t)) tags.push('question')
  else if (/aide|help|besoin|quelqu.un/.test(t)) tags.push('aide')

  return [...new Set(tags)].slice(0, 3)
}
