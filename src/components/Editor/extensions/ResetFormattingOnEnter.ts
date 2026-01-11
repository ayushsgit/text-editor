import { Extension } from '@tiptap/core'

export const ResetFormattingOnEnter = Extension.create({
    name: 'resetFormattingOnEnter',

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                // Get the current chain
                const chain = editor.chain()

                // First, create the new paragraph with default Enter behavior
                // Then unset marks and reset alignment

                // We need to handle this after the default Enter behavior
                // So we return false to let default behavior happen first
                // Then use a microtask to clean up the new line

                queueMicrotask(() => {
                    editor
                        .chain()
                        .unsetBold()
                        .unsetItalic()
                        .setTextAlign('left')
                        .run()
                })

                // Return false to allow default Enter behavior
                return false
            },
        }
    },
})
