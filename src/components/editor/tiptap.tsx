'use client'

import { useRef, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

type SlashCmd = {
  id: string
  title: string
  desc: string
  label: string
  exec: (editor: Editor, range: Range) => void
}

const SLASH_CMDS: SlashCmd[] = [
  {
    id: 'h1', title: 'Heading 1', desc: 'Large section heading', label: 'H1',
    exec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    id: 'h2', title: 'Heading 2', desc: 'Medium section heading', label: 'H2',
    exec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    id: 'h3', title: 'Heading 3', desc: 'Small section heading', label: 'H3',
    exec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet', title: 'Bullet List', desc: 'Create a bullet list', label: '•',
    exec: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    id: 'ordered', title: 'Ordered List', desc: 'Create a numbered list', label: '1.',
    exec: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    id: 'todo', title: 'To-do List', desc: 'Track tasks with checkboxes', label: '☑',
    exec: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    id: 'code', title: 'Code Block', desc: 'Code with syntax highlighting', label: '</>',
    exec: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    id: 'quote', title: 'Blockquote', desc: 'Capture a quote or callout', label: '"',
    exec: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    id: 'divider', title: 'Divider', desc: 'Visually divide the page', label: '—',
    exec: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
]

type SlashMenuState = {
  items: SlashCmd[]
  selectedIndex: number
  rect: DOMRect | null
}

type Props = {
  content?: unknown
  onChange?: (json: unknown) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = 'Write something…',
  editable = true,
  className,
}: Props) {
  const [slashMenu, setSlashMenuState] = useState<SlashMenuState | null>(null)
  // Stable ref so the extension (created once in useMemo) can always call the latest setter
  const setSlashRef = useRef<(v: SlashMenuState | null) => void>(() => {})
  setSlashRef.current = setSlashMenuState
  // Holds the current suggestion session's command function for mouse-click support
  const slashCommandRef = useRef<((item: SlashCmd) => void) | null>(null)

  const slashExtension = useMemo(
    () =>
      Extension.create({
        name: 'slashCommand',
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: '/',
              items({ query }) {
                const q = query.toLowerCase()
                return SLASH_CMDS.filter((c) => q === '' || c.title.toLowerCase().includes(q))
              },
              command({ editor, range, props }) {
                ;(props as SlashCmd).exec(editor, range)
              },
              render() {
                let selectedIndex = 0
                let itemsSnapshot: SlashCmd[] = []
                let currentRect: DOMRect | null = null

                return {
                  onStart(props) {
                    selectedIndex = 0
                    itemsSnapshot = props.items as SlashCmd[]
                    slashCommandRef.current = props.command as (item: SlashCmd) => void
                    currentRect = props.clientRect?.() ?? null
                    setSlashRef.current({ items: itemsSnapshot, selectedIndex, rect: currentRect })
                  },
                  onUpdate(props) {
                    selectedIndex = 0
                    itemsSnapshot = props.items as SlashCmd[]
                    slashCommandRef.current = props.command as (item: SlashCmd) => void
                    currentRect = props.clientRect?.() ?? null
                    setSlashRef.current({ items: itemsSnapshot, selectedIndex, rect: currentRect })
                  },
                  onExit() {
                    slashCommandRef.current = null
                    setSlashRef.current(null)
                  },
                  onKeyDown({ event }) {
                    if (!itemsSnapshot.length) return false
                    if (event.key === 'ArrowUp') {
                      selectedIndex = (selectedIndex - 1 + itemsSnapshot.length) % itemsSnapshot.length
                      setSlashRef.current({ items: itemsSnapshot, selectedIndex, rect: currentRect })
                      return true
                    }
                    if (event.key === 'ArrowDown') {
                      selectedIndex = (selectedIndex + 1) % itemsSnapshot.length
                      setSlashRef.current({ items: itemsSnapshot, selectedIndex, rect: currentRect })
                      return true
                    }
                    if (event.key === 'Enter' && slashCommandRef.current) {
                      slashCommandRef.current(itemsSnapshot[selectedIndex])
                      return true
                    }
                    if (event.key === 'Escape') {
                      setSlashRef.current(null)
                      return true
                    }
                    return false
                  },
                }
              },
            }),
          ]
        },
      }),
    []
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
      slashExtension,
    ],
    content: (content as object) || '',
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] text-[var(--text-primary)]',
      },
    },
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className={cn('rounded-lg border border-[var(--border)]', className)}>
      {editable && (
        <div
          className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap border-[var(--border)] bg-[var(--sidebar-bg)] rounded-t-lg"
        >
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">
            <Heading1 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
            <Heading2 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
            <Heading3 className="h-3.5 w-3.5" />
          </Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <Bold className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <Italic className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
            <Code className="h-3.5 w-3.5" />
          </Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <List className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
            <ListOrdered className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Todo list">
            <CheckSquare className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
            <Quote className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
            <span className="text-xs font-mono font-bold">{'</>'}</span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
            <Minus className="h-3.5 w-3.5" />
          </Btn>
        </div>
      )}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      {slashMenu && slashMenu.items.length > 0 && slashMenu.rect && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] rounded-lg border overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-2xl min-w-[230px]"
        >
          {slashMenu.items.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseDown={(e) => {
                e.preventDefault()
                slashCommandRef.current?.(cmd)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                i === slashMenu.selectedIndex ? 'bg-[var(--surface-hover)]' : 'bg-transparent'
              )}
            >
              <span
                className="shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold font-mono bg-[var(--background)] text-[var(--text-secondary)]"
              >
                {cmd.label}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none mb-0.5 text-[var(--text-primary)]">
                  {cmd.title}
                </p>
                <p className="text-xs truncate text-[var(--text-muted)]">
                  {cmd.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'h-6 w-6 rounded flex items-center justify-center transition-colors shrink-0',
        active ? 'bg-[var(--surface-hover)] text-[var(--primary)]' : 'bg-transparent text-[var(--text-secondary)]'
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 mx-0.5 shrink-0 bg-[var(--border)]" />
}
