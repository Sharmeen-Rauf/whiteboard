'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DrawingCanvas from '@/components/DrawingCanvas'
import DrawingToolbar from '@/components/DrawingToolbar'
import { DrawingTool, DrawingState } from '@/lib/drawing'

export default function WhiteboardPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [tool, setTool] = useState<DrawingTool>('select')
  const [drawingState, setDrawingState] = useState<DrawingState>({
    tool: 'select',
    strokeColor: '#000000',
    fillColor: '#ffffff',
    strokeWidth: 2,
    fontSize: 24,
  })
  const [userName, setUserName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(true)

  useEffect(() => {
    const savedName = localStorage.getItem('whiteboard_userName')
    if (savedName) {
      setUserName(savedName)
      setShowJoinModal(false)
    }
  }, [])

  const handleJoin = () => {
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }
    localStorage.setItem('whiteboard_userName', userName)
    setShowJoinModal(false)
  }

  const handleStateChange = (newState: Partial<DrawingState>) => {
    setDrawingState((prev) => ({ ...prev, ...newState }))
  }

  const handleExport = () => {
    // Export canvas as image
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `whiteboard-${roomId}-${Date.now()}.png`
      a.click()
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire whiteboard?')) {
      if (typeof window !== 'undefined' && (window as any)[`clear_${roomId}`]) {
        (window as any)[`clear_${roomId}`]()
      }
    }
  }

  if (showJoinModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Join Whiteboard</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span className="text-sm">Private board (only you can see)</span>
              </label>
            </div>
            <button
              onClick={handleJoin}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Join Whiteboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <DrawingToolbar
        tool={tool}
        onToolChange={setTool}
        drawingState={drawingState}
        onStateChange={handleStateChange}
        onClear={handleClear}
        onExport={handleExport}
      />
      <div className="flex-1 overflow-hidden">
        <DrawingCanvas
          roomId={roomId}
          isPrivate={isPrivate}
          userName={userName}
          tool={tool}
          drawingState={drawingState}
          onClear={handleClear}
        />
      </div>
    </div>
  )
}
