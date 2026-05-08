'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, UnderlineIcon, Heading2, List, ListOrdered, Link as LinkIcon, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RichTextEditorProps {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'p-1.5 rounded text-xs transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border mx-0.5 self-center" />;
}

export function RichTextEditor({
  defaultValue = '',
  onChange,
  placeholder = 'Enter content…',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    ],
    // Initialise once — editor is uncontrolled after mount.
    // Do NOT sync value back in via useEffect; that causes a re-render loop
    // where every keystroke re-sets content and jumps the cursor.
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[140px] px-3 py-2.5 focus:outline-none text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  function addLink() {
    const url = window.prompt('URL');
    if (!url) return;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden bg-background', className)}>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/40 border-b border-border">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
          <span className="text-[11px] font-semibold leading-none">H3</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={addLink} active={editor?.isActive('link')} title="Add link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider line">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
