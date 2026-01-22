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
      className={`absolute rounded-lg p-4 min-w-[250px] max-w-[400px] note-shadow transition-all ${
        isDragging ? 'opacity-80 z-50' : 'hover:note-shadow-hover z-10'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: note.color,
        border: `2px solid ${note.color === '#fff9c4' ? '#fdd835' : 'rgba(0,0,0,0.1)'}`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
        <div className="flex-1">
          <div className="font-bold text-lg text-gray-800">{note.name}</div>
          {note.title && (
            <div className="text-sm text-gray-600 italic">{note.title}</div>
          )}
          {(note.category || (note.tags && note.tags.length > 0)) && (
            <div className="flex gap-2 mt-1 flex-wrap">
              {note.category && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {note.category}
                </span>
              )}
              {note.tags && note.tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <button
              className="note-edit w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-all hover:scale-110"
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
            className="note-delete w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-all hover:scale-110"
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
      <div className="text-gray-700 whitespace-pre-wrap break-words mb-2">
        {note.content}
      </div>
      {note.links.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {note.links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-indigo-600 text-sm mb-1 hover:underline break-all"
            >
              {link}
            </a>
          ))}
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        {note.updatedAt ? (
          <>Updated: {new Date(note.updatedAt).toLocaleString()}</>
        ) : (
          <>Created: {new Date(note.createdAt).toLocaleString()}</>
        )}
      </div>
    </div>
  )
}
