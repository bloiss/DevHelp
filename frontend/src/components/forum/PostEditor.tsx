import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Heading2, Terminal, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostEditorProps {
  onChange: (html: string) => void
  error?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-all duration-100 text-sm',
        active
          ? 'bg-primary/15 text-primary shadow-inner'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-border mx-0.5 shrink-0" />
}

export function PostEditor({ onChange, error }: PostEditorProps) {
  const [wordCount, setWordCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Décris ton problème ou partage ta découverte…',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[200px] px-4 py-3 focus:outline-none prose prose-sm dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      const text = editor.getText().trim()
      setWordCount(text === '' ? 0 : text.split(/\s+/).length)
    },
  })

  if (!editor) return null

  return (
    <div className={cn(
      'rounded-xl border bg-card overflow-hidden transition-all duration-150',
      error
        ? 'border-destructive'
        : 'border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20',
    )}>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/50 border-b border-border flex-wrap">

        {/* Texte */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Titre (Ctrl+Alt+2)"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Gras (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italique (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Barré (Ctrl+Shift+S)"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Code */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Code inline (Ctrl+E)"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Bloc de code (Ctrl+Alt+C)"
        >
          <Terminal className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Listes */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Séparateur horizontal */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Séparateur"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Zone de saisie */}
      <EditorContent editor={editor} />

      {/* Pied de l'éditeur — compte de mots */}
      <div className="flex items-center justify-end px-3 py-1.5 bg-muted/30 border-t border-border">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {wordCount} mot{wordCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
