import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Heading2, Terminal, Minus, ImageIcon, Loader2, Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadImage, validateImageFile } from '@/services/upload.service'
import { toast } from '@/stores/toastStore'
import { api } from '@/lib/api'

interface PostEditorProps {
  onChange: (html: string) => void
  error?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-md transition-all duration-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed',
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
  const [uploading, setUploading] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleImprove = async () => {
    if (!editor) return
    const text = editor.getText().trim()
    if (!text) {
      toast.error('Contenu vide', { description: 'Écris quelque chose avant d\'utiliser l\'IA.' })
      return
    }
    setIsImproving(true)
    try {
      const res = await api.post('/ai/assist', { text })
      const improved: string = res.data.result ?? ''
      const html = improved
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('') || `<p>${improved}</p>`
      editor.commands.setContent(html, true)
    } catch {
      toast.error('Erreur IA', { description: 'Impossible de contacter le service IA.' })
    } finally {
      setIsImproving(false)
    }
  }


  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Décris ton problème ou partage ta découverte…',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-2',
        },
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

  const handleImageFile = async (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploading(true)
    try {
      const result = await uploadImage(file)
      editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run()
    } catch {
      toast.error('Erreur lors de l\'upload de l\'image.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      e.preventDefault()
      handleImageFile(file)
    }
  }

  if (!editor) return null

  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden transition-all duration-150',
        error
          ? 'border-destructive'
          : 'border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20',
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
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

        <Divider />

        {/* Image upload */}
        <ToolbarButton
          onClick={handleImageButtonClick}
          title="Insérer une image (PNG, JPEG, GIF — max 20 MB)"
          disabled={uploading}
        >
          {uploading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ImageIcon className="h-4 w-4" />
          }
        </ToolbarButton>

        <input 
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
         type="button"
       onClick={handleImprove}
       disabled={isImproving}
       title="Améliorer avec l'IA"
         className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-violet-500 hover:bg-violet-500/10 disabled:opacity-50"
>
      <Wand2 className="h-3.5 w-3.5" />
       {isImproving ? 'Amélioration…' : 'IA'}
    </button>
      </div>
          
      {/* Zone de saisie */}
      <EditorContent editor={editor} />

      {/* Pied de l'éditeur */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t border-border">
        <span className="text-[11px] text-muted-foreground">
          Glisse une image ou clique <ImageIcon className="inline h-3 w-3" /> pour uploader
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {wordCount} mot{wordCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
