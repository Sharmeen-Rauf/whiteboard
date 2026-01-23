'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import type { 
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from '@excalidraw/excalidraw/types'

// Import Excalidraw CSS
import '@excalidraw/excalidraw/index.css'

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  {
    ssr: false,
  }
)

interface ExcalidrawWrapperProps {
  roomId: string
  isPrivate?: boolean
  userName?: string
}

export default function ExcalidrawWrapper({ 
  roomId, 
  isPrivate = false, 
  userName = 'Anonymous' 
}: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Set asset path for Excalidraw
    if (typeof window !== 'undefined') {
      if (!(window as any).EXCALIDRAW_ASSET_PATH) {
        ;(window as any).EXCALIDRAW_ASSET_PATH = window.location.origin
      }
      setIsReady(true)
    }
  }, [])

  const handleChange = (
    elements: readonly any[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      const data = {
        elements: Array.from(elements), // Convert readonly array to regular array for JSON
        appState,
        files, // BinaryFiles is already a Record (object)
        version: 2,
        type: 'excalidraw',
      }
      localStorage.setItem(`excalidraw_${roomId}`, JSON.stringify(data))
    }
  }

  // Load saved data on mount
  useEffect(() => {
    if (!excalidrawAPI || !isReady) return

    try {
      const saved = localStorage.getItem(`excalidraw_${roomId}`)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.elements && data.appState) {
          excalidrawAPI.updateScene({
            elements: data.elements,
            appState: data.appState,
            files: data.files,
          })
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error)
    }
  }, [excalidrawAPI, roomId, isReady])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Excalidraw...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-2 z-10 flex gap-2 flex-wrap">
        {isPrivate && (
          <div className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs text-yellow-800">
            🔒 Private Board
          </div>
        )}
        {!isPrivate && (
          <div className="bg-green-100 border border-green-300 rounded px-2 py-1 text-xs text-green-800">
            🌐 Public Board - Share URL to collaborate
          </div>
        )}
      </div>
      <Excalidraw
        ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: true,
            toggleTheme: true,
          },
        }}
      />
    </div>
  )
}
