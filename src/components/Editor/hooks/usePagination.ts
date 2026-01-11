import { Editor } from '@tiptap/react'
import { useEffect, useRef, useCallback } from 'react'

// Constants for US Letter size at 96 DPI
const PAGE_HEIGHT_PX = 1056 // 11 inches
const PAGE_PADDING_PX = 96  // 1 inch margins top and bottom
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - (PAGE_PADDING_PX * 2) // 864px usable
const MAX_PAGES = 50

export function usePagination(editor: Editor | null) {
    const isProcessing = useRef(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastDocSize = useRef(0)

    const cleanupEmptyPages = useCallback(() => {
        if (!editor) return false

        const { view } = editor
        const { doc, tr, selection } = view.state

        // Find empty pages (except first)
        const pagesToDelete: { pos: number; size: number }[] = []

        doc.forEach((node, offset, index) => {
            if (node.type.name === 'page' && index > 0) {
                // Check if page only has empty content
                const textContent = node.textContent?.trim() || ''

                // Check if selection is inside this page
                const pageEnd = offset + node.nodeSize
                const isSelectionInside = selection.from >= offset && selection.to <= pageEnd

                if ((textContent === '' || node.childCount === 0) && !isSelectionInside) {
                    pagesToDelete.push({ pos: offset, size: node.nodeSize })
                }
            }
        })

        if (pagesToDelete.length > 0) {
            // Delete from end to start to maintain positions
            let transaction = tr
            for (let i = pagesToDelete.length - 1; i >= 0; i--) {
                const { pos, size } = pagesToDelete[i]
                const mappedPos = transaction.mapping.map(pos)
                transaction = transaction.delete(mappedPos, mappedPos + size)
            }
            view.dispatch(transaction)
            return true
        }

        return false
    }, [editor])

    const processPagination = useCallback(() => {
        if (!editor || isProcessing.current) return

        isProcessing.current = true

        try {
            const { view } = editor
            const { doc, schema } = view.state

            // Safety: Check if doc changed significantly
            const currentDocSize = doc.content.size
            if (Math.abs(currentDocSize - lastDocSize.current) > 5000) {
                // Large paste detected - be extra careful
                lastDocSize.current = currentDocSize
            }

            // First: Clean up any empty pages
            if (cleanupEmptyPages()) {
                isProcessing.current = false
                // Reschedule with delay
                timeoutRef.current = setTimeout(processPagination, 200)
                return
            }

            // Count current pages
            let pageCount = 0
            doc.forEach((node) => {
                if (node.type.name === 'page') pageCount++
            })

            if (pageCount >= MAX_PAGES) {
                isProcessing.current = false
                return
            }

            // Find the first page that overflows
            let overflowFound = false

            doc.forEach((node, offset) => {
                if (overflowFound) return
                if (node.type.name !== 'page') return

                const dom = view.nodeDOM(offset) as HTMLElement
                if (!dom) return

                // Measure content height
                let contentHeight = 0
                Array.from(dom.children).forEach((child) => {
                    contentHeight += (child as HTMLElement).offsetHeight || 0
                })

                // Only process if significantly over the limit
                if (contentHeight <= CONTENT_HEIGHT_PX + 20) return

                // Find the block that overflows
                let accHeight = 0
                let splitOffset = -1
                let foundSplit = false

                node.forEach((child, childOffset) => {
                    if (foundSplit) return

                    const childPos = offset + 1 + childOffset
                    const childDom = view.nodeDOM(childPos) as HTMLElement
                    if (!childDom) return

                    const h = childDom.offsetHeight || 0
                    if (accHeight + h > CONTENT_HEIGHT_PX && accHeight > 0) {
                        splitOffset = childOffset
                        foundSplit = true
                    } else {
                        accHeight += h
                    }
                })

                if (splitOffset === -1 || splitOffset === 0) return

                // Calculate what to move
                const pageStart = offset
                const pageEnd = offset + node.nodeSize
                const splitPos = offset + 1 + splitOffset

                // Slice content to move
                const sliceStart = splitPos
                const sliceEnd = pageEnd - 1 // Before closing tag

                if (sliceStart >= sliceEnd) return

                const slice = doc.slice(sliceStart, sliceEnd)

                // Check slice has real content
                let hasContent = false
                slice.content.forEach((n) => {
                    if (n.textContent?.trim()) hasContent = true
                })

                if (!hasContent) return

                // Execute the split
                const tr = view.state.tr

                // Delete from current page
                tr.delete(
                    tr.mapping.map(sliceStart),
                    tr.mapping.map(sliceEnd)
                )

                // Create new page with the content
                const newPage = schema.nodes.page.create(null, slice.content)
                tr.insert(tr.doc.content.size, newPage)

                view.dispatch(tr)
                overflowFound = true
            })

            if (overflowFound) {
                // Schedule another check
                timeoutRef.current = setTimeout(() => {
                    isProcessing.current = false
                    processPagination()
                }, 150)
            } else {
                isProcessing.current = false
                lastDocSize.current = doc.content.size
            }

        } catch (error) {
            console.error('Pagination error:', error)
            isProcessing.current = false
        }
    }, [editor, cleanupEmptyPages])

    const debouncedProcess = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        // Longer debounce for stability
        timeoutRef.current = setTimeout(processPagination, 250)
    }, [processPagination])

    useEffect(() => {
        if (!editor) return

        editor.on('update', debouncedProcess)

        // Initial check
        const initialTimeout = setTimeout(processPagination, 500)

        return () => {
            editor.off('update', debouncedProcess)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            clearTimeout(initialTimeout)
        }
    }, [editor, debouncedProcess, processPagination])
}
