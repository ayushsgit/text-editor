import { Node, mergeAttributes } from '@tiptap/core'

export const Page = Node.create({
    name: 'page',
    content: 'block+',
    group: 'block',
    defining: true,
    isolating: true,

    parseHTML() {
        return [
            { tag: 'div[data-type="page"]' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'page',
                class: 'page-node'
            }),
            0
        ]
    },
})
