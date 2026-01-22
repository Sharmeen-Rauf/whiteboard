'use client'

import { useState, useEffect } from 'react'
import NoteModal from '@/components/NoteModal'
import Note from '@/components/Note'

export interface NoteData {
  id: number
  name: string
  title?: string
  content: string
  links: string[]
  color: string
  position: { x: number; y: number }
  category?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
}

export default function Home() {
  const [notes, setNotes] = useState<NoteData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whiteboardNotes')
      if (saved) {
        try {
          const parsedNotes = JSON.parse(saved)
          // Migrate old notes to include new fields
          const migratedNotes = parsedNotes.map((note: any) => ({
            ...note,
            category: note.category || 'general',
            tags: note.tags || [],
            createdAt: note.createdAt || new Date().toISOString(),
            updatedAt: note.updatedAt,
          }))
          setNotes(migratedNotes)
        } catch (e) {
          console.error('Error loading notes:', e)
        }
      }
    }
  }

  const saveNotes = (newNotes: NoteData[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whiteboardNotes', JSON.stringify(newNotes))
    }
  }

  const addNote = (noteData: Omit<NoteData, 'id' | 'position' | 'createdAt' | 'updatedAt'>) => {
    const newNote: NoteData = {
      ...noteData,
      id: Date.now(),
      position: {
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 400 : 800) + 50,
        y: Math.random() * 300 + 50,
      },
      createdAt: new Date().toISOString(),
      category: noteData.category || 'general',
      tags: noteData.tags || [],
    }
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
  }

  const updateNote = (id: number, noteData: Omit<NoteData, 'id' | 'position' | 'createdAt'>) => {
    const existingNote = notes.find(n => n.id === id)
    if (!existingNote) return

    const updatedNote: NoteData = {
      ...noteData,
      id,
      position: existingNote.position,
      createdAt: existingNote.createdAt,
      updatedAt: new Date().toISOString(),
    }
    const updatedNotes = notes.map(note => note.id === id ? updatedNote : note)
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
    setEditingNote(null)
  }

  const updateNotePosition = (id: number, position: { x: number; y: number }) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, position } : note
    )
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
  }

  const deleteNote = (id: number) => {
    const updatedNotes = notes.filter((note) => note.id !== id)
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all notes?')) {
      setNotes([])
      saveNotes([])
    }
  }

  const exportNotes = () => {
    const data = {
      notes,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whiteboard-notes-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsText = () => {
    const text = notes.map(note => {
      let text = `\n${'='.repeat(50)}\n`
      text += `Name: ${note.name}\n`
      if (note.title) text += `Role: ${note.title}\n`
      if (note.category) text += `Category: ${note.category}\n`
      if (note.tags && note.tags.length > 0) text += `Tags: ${note.tags.join(', ')}\n`
      text += `\n${note.content}\n`
      if (note.links.length > 0) {
        text += `\nLinks:\n${note.links.map(link => `  - ${link}`).join('\n')}\n`
      }
      text += `\nCreated: ${new Date(note.createdAt).toLocaleString()}\n`
      return text
    }).join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whiteboard-notes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(notes.map(n => n.category).filter(Boolean)))]

  // Filter notes based on search and category
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Minimal Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">Company Whiteboard</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingNote(null)
              setIsModalOpen(true)
            }}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + Add Note
          </button>
          <button
            onClick={exportNotes}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Export"
          >
            💾
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Clear All"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Whiteboard Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white whiteboard-grid">
        {notes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold mb-2">Put yours anywhere! 🎨</h2>
              <p>Click "+ Add Note" to share your thoughts, work updates, or links</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <h2 className="text-xl font-semibold mb-2">No notes found</h2>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Note
              key={note.id}
              note={note}
              onPositionUpdate={updateNotePosition}
              onDelete={deleteNote}
              onEdit={() => {
                setEditingNote(note)
                setIsModalOpen(true)
              }}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingNote(null)
        }}
        onAdd={addNote}
        onUpdate={updateNote}
        editingNote={editingNote}
      />
    </div>
  )
}
