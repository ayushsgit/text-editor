'use client'

import { Editor } from '@tiptap/react'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Type,
    Printer,
    FileText,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState, useCallback } from 'react'

interface ToolbarProps {
    editor: Editor | null
}

const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
}: {
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title?: string
}) => (
    <button
        onClick={onClick}
        title={title}
        className={cn(
            'p-2 rounded transition-all duration-150',
            'hover:bg-gray-200',
            isActive
                ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600'
                : 'text-gray-700'
        )}
        type="button"
    >
        {children}
    </button>
)

export function Toolbar({ editor }: ToolbarProps) {
    const [pageCount, setPageCount] = useState(1)
    const [, forceUpdate] = useState({})

    // Force re-render on selection change to update active states
    const handleUpdate = useCallback(() => {
        forceUpdate({})
    }, [])

    useEffect(() => {
        if (!editor) return

        const updatePageCount = () => {
            const pages = editor.state.doc.content.content.filter(
                node => node.type.name === 'page'
            )
            setPageCount(pages.length || 1)
        }

        updatePageCount()
        editor.on('update', updatePageCount)
        editor.on('selectionUpdate', handleUpdate)
        editor.on('transaction', handleUpdate)

        return () => {
            editor.off('update', updatePageCount)
            editor.off('selectionUpdate', handleUpdate)
            editor.off('transaction', handleUpdate)
        }
    }, [editor, handleUpdate])

    if (!editor) return null

    return (
        <div className="border-b bg-white shadow-sm px-4 py-2 flex items-center gap-2 flex-wrap">
            {/* Heading Controls */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    isActive={editor.isActive('paragraph') && !editor.isActive('heading')}
                    title="Paragraph"
                >
                    <Type size={18} />
                </ToolbarButton>
            </div>

            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={18} />
                </ToolbarButton>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    isActive={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify size={18} />
                </ToolbarButton>
            </div>

            {/* List Controls */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
            </div>

            {/* Page Count */}
            <div className="flex items-center gap-2 text-sm text-gray-600 border-r pr-3 mr-2">
                <FileText size={16} />
                <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            </div>

            {/* Print Button */}
            <div className="ml-auto">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Printer size={16} />
                    Print / Save PDF
                </button>
            </div>
        </div>
    )
}
