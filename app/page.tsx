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
    <div className="min-h-screen p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white rounded-xl shadow-lg p-6 mb-5">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 Company Meeting Whiteboard
          </h1>
          <p className="text-gray-600 mb-4">
            Share your thoughts and what you're working on!
          </p>
          {/* Search and Filter */}
          <div className="mb-4 flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setEditingNote(null)
                setIsModalOpen(true)
              }}
              className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              + Add Your Note
            </button>
            <button
              onClick={clearAll}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
            >
              Clear All
            </button>
            <button
              onClick={exportNotes}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
            >
              Export JSON
            </button>
            <button
              onClick={exportAsText}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
            >
              Export Text
            </button>
          </div>
          {filteredNotes.length !== notes.length && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredNotes.length} of {notes.length} notes
            </p>
          )}
        </header>

        {/* Whiteboard */}
        <div className="bg-gray-100 rounded-xl shadow-lg p-8 min-h-[600px] relative overflow-hidden">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-40">
              <h2 className="text-2xl font-semibold mb-2">Put yours anywhere! 🎨</h2>
              <p>Click "Add Your Note" to share your thoughts, work updates, or links</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-gray-500 py-40">
              <h2 className="text-2xl font-semibold mb-2">No notes found</h2>
              <p>Try adjusting your search or filter criteria</p>
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
    </div>
  )
}
