'use client'

import { useState, useEffect } from 'react'
import { NoteData } from '@/app/page'

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (note: Omit<NoteData, 'id' | 'position' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: number, note: Omit<NoteData, 'id' | 'position' | 'createdAt'>) => void
  editingNote?: NoteData | null
}

export default function NoteModal({ isOpen, onClose, onAdd, onUpdate, editingNote }: NoteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    content: '',
    links: '',
    color: '#fff9c4',
    category: 'general',
    tags: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        // Populate form with editing note data
        setFormData({
          name: editingNote.name,
          title: editingNote.title || '',
          content: editingNote.content,
          links: editingNote.links.join('\n'),
          color: editingNote.color,
          category: editingNote.category || 'general',
          tags: editingNote.tags?.join(', ') || '',
        })
      } else {
        // Reset form when modal opens for new note
        setFormData({
          name: '',
          title: '',
          content: '',
          links: '',
          color: '#fff9c4',
          category: 'general',
          tags: '',
        })
      }
    }
  }, [isOpen, editingNote])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.content.trim()) return

    const links = formData.links
      .split('\n')
      .map((link) => link.trim())
      .filter((link) => link.length > 0)
      .map((link) => {
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          return 'https://' + link
        }
        return link
      })

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const noteData = {
      name: formData.name.trim(),
      title: formData.title.trim() || undefined,
      content: formData.content.trim(),
      links,
      color: formData.color,
      category: formData.category,
      tags: tags.length > 0 ? tags : undefined,
    }

    if (editingNote && onUpdate) {
      onUpdate(editingNote.id, noteData)
    } else {
      onAdd(noteData)
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-3xl font-bold"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingNote ? 'Edit Note' : 'Add Your Note'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Your Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Title/Role:
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Software Engineer, Founder, etc."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              What you're working on / Thoughts:{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              placeholder="Share what you're working on, your thoughts, or updates..."
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Links (one per line):
            </label>
            <textarea
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              rows={3}
              placeholder="Portfolio, LinkedIn, GitHub, etc. (one per line)"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category:
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="project">Project</option>
                <option value="idea">Idea</option>
                <option value="update">Update</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Note Color:
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Tags (comma separated):
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., frontend, backend, urgent"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full px-5 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all hover:shadow-lg"
          >
            {editingNote ? 'Update Note' : 'Add Note'}
          </button>
        </form>
      </div>
    </div>
  )
}
