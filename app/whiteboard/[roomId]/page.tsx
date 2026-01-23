'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ExcalidrawWrapper from '@/components/ExcalidrawWrapper'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function WhiteboardPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm">🔒 Private board (only you can see - no collaboration)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Uncheck to enable real-time collaboration with others
              </p>
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
      {/* Header with share option */}
      <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Company Whiteboard</h1>
        {!isPrivate && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? window.location.href : ''}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 max-w-md"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied! Share it with others to collaborate.')
                }
              }}
              className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              📋 Copy Link
            </button>
          </div>
        )}
      </div>
      
      {/* Excalidraw Canvas */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <ExcalidrawWrapper
            roomId={roomId}
            isPrivate={isPrivate}
            userName={userName}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}
