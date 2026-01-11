'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { CustomDocument } from './extensions/Document'
import { Page } from './extensions/Page'
import { ResetFormattingOnEnter } from './extensions/ResetFormattingOnEnter'
import { Toolbar } from './Toolbar'
import { usePagination } from './hooks/usePagination'

export default function Editor() {
    const editor = useEditor({
        extensions: [
            CustomDocument,
            StarterKit.configure({
                document: false,
            }),
            Page,
            Placeholder.configure({
                placeholder: 'Start typing...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            ResetFormattingOnEnter,
        ],
        content: '<div data-type="page"><p></p></div>',
        editorProps: {
            attributes: {
                class: 'focus:outline-none print:block',
            },
        },
        immediatelyRender: false,
    })

    usePagination(editor)

    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 print:bg-white print:h-auto">
            <div className="sticky top-0 z-50 print:hidden">
                <Toolbar editor={editor} />
            </div>
            <div className="flex-1 overflow-y-auto print:overflow-visible p-8 print:p-0">
                <EditorContent editor={editor} className="print:m-0" />
            </div>
        </div>
    )
}
