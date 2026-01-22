'use client'

import { useState, useRef, useEffect } from 'react'
import { NoteData } from '@/app/page'

interface NoteProps {
  note: NoteData
  onPositionUpdate: (id: number, position: { x: number; y: number }) => void
  onDelete: (id: number) => void
  onEdit?: () => void
}

export default function Note({ note, onPositionUpdate, onDelete, onEdit }: NoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(note.position)
  const noteRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setPosition(note.position)
  }, [note.position])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.note-delete')) return

    setIsDragging(true)
    const rect = noteRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !noteRef.current) return

      const whiteboard = noteRef.current.parentElement
      if (!whiteboard) return

      const whiteboardRect = whiteboard.getBoundingClientRect()

      let x = e.clientX - whiteboardRect.left - dragOffset.current.x
      let y = e.clientY - whiteboardRect.top - dragOffset.current.y

      // Keep note within whiteboard bounds
      const noteWidth = noteRef.current.offsetWidth
      const noteHeight = noteRef.current.offsetHeight
      x = Math.max(0, Math.min(x, whiteboardRect.width - noteWidth))
      y = Math.max(0, Math.min(y, whiteboardRect.height - noteHeight))

      setPosition({ x, y })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        onPositionUpdate(note.id, position)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, note.id, position, onPositionUpdate])

  const escapeHtml = (text: string) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  return (
    <div
      ref={noteRef}
      className={`absolute p-4 min-w-[280px] max-w-[420px] bg-white border-2 border-gray-300 transition-all ${
        isDragging ? 'opacity-90 z-50 shadow-lg' : 'hover:shadow-md z-10'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: note.color || '#ffffff',
        borderColor: note.color === '#fff9c4' ? '#fdd835' : (note.color === '#ffffff' ? '#d1d5db' : note.color),
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="font-bold text-xl text-gray-900 mb-1" style={{ fontFamily: 'inherit' }}>
            {note.name}
          </div>
          {note.title && (
            <div className="text-sm text-gray-600 mb-2">{note.title}</div>
          )}
        </div>
        <div className="flex gap-1 ml-3">
          {onEdit && (
            <button
              className="note-edit w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title="Edit note"
            >
              ✎
            </button>
          )}
          <button
            className="note-delete w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(note.id)
            }}
            title="Delete note"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-800 whitespace-pre-wrap break-words mb-3 leading-relaxed">
        {note.content}
      </div>

      {/* Links */}
      {note.links.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {note.links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 text-sm mb-1.5 hover:underline break-all"
            >
              {link}
            </a>
          ))}
        </div>
      )}

      {/* Tags/Category - Minimal */}
      {(note.category || (note.tags && note.tags.length > 0)) && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {note.category && note.category !== 'general' && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
              {note.category}
            </span>
          )}
          {note.tags && note.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
