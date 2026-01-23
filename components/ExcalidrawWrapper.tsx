'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { 
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  BinaryFileData,
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
  const [users, setUsers] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const socketRef = useRef<Socket | null>(null)
  const isLocalChangeRef = useRef(false)

  useEffect(() => {
    // Set asset path for Excalidraw
    if (typeof window !== 'undefined') {
      if (!(window as any).EXCALIDRAW_ASSET_PATH) {
        ;(window as any).EXCALIDRAW_ASSET_PATH = window.location.origin
      }
      setIsReady(true)
    }
  }, [])

  // Initialize Socket.io connection for real-time collaboration
  useEffect(() => {
    if (typeof window === 'undefined' || isPrivate) {
      setConnectionStatus('disconnected')
      return
    }

    try {
      setConnectionStatus('connecting')
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to server')
        setConnectionStatus('connected')
        socket.emit('join-room', { roomId, userName, isPrivate: isPrivate.toString() })
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnectionStatus('disconnected')
      })

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected')
      })

      socket.on('user-joined', (userList: string[]) => {
        setUsers(userList)
      })

      socket.on('user-left', (userList: string[]) => {
        setUsers(userList)
      })

      // Receive updates from other users
      socket.on('excalidraw-update', (data: { elements: any[], appState: AppState, files: BinaryFiles }) => {
        if (!excalidrawAPI || isLocalChangeRef.current) {
          isLocalChangeRef.current = false
          return
        }

        try {
          excalidrawAPI.updateScene({
            elements: data.elements,
            appState: data.appState,
          })

          // Handle files if needed
          if (data.files && Object.keys(data.files).length > 0) {
            const fileData: BinaryFileData[] = Object.values(data.files).map((file: any) => ({
              mimeType: file.mimeType,
              id: file.id,
              dataURL: file.dataURL,
              created: file.created || Date.now(),
            }))
            if (fileData.length > 0) {
              excalidrawAPI.addFiles(fileData)
            }
          }
        } catch (error) {
          console.error('Error applying remote update:', error)
        }
      })

      // Receive initial canvas state
      socket.on('excalidraw-state', (data: { elements: any[], appState: AppState, files: BinaryFiles }) => {
        if (!excalidrawAPI) return

        try {
          excalidrawAPI.updateScene({
            elements: data.elements || [],
            appState: data.appState || {},
          })

          if (data.files && Object.keys(data.files).length > 0) {
            const fileData: BinaryFileData[] = Object.values(data.files).map((file: any) => ({
              mimeType: file.mimeType,
              id: file.id,
              dataURL: file.dataURL,
              created: file.created || Date.now(),
            }))
            if (fileData.length > 0) {
              excalidrawAPI.addFiles(fileData)
            }
          }
        } catch (error) {
          console.error('Error loading initial state:', error)
        }
      })

      return () => {
        socket.disconnect()
      }
    } catch (error) {
      console.error('Error initializing socket:', error)
      setConnectionStatus('disconnected')
    }
  }, [roomId, userName, isPrivate])

  const handleChange = (
    elements: readonly any[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      const data = {
        elements: Array.from(elements),
        appState,
        files,
        version: 2,
        type: 'excalidraw',
      }
      localStorage.setItem(`excalidraw_${roomId}`, JSON.stringify(data))
    }

    // Broadcast to other users in real-time (if not private and connected)
    if (!isPrivate && socketRef.current && socketRef.current.connected) {
      isLocalChangeRef.current = true
      socketRef.current.emit('excalidraw-change', {
        roomId,
        elements: Array.from(elements),
        appState,
        files,
      })
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
          })
          
          // Restore files if they exist
          if (data.files && Object.keys(data.files).length > 0) {
            const fileData: BinaryFileData[] = Object.values(data.files).map((file: any) => ({
              mimeType: file.mimeType,
              id: file.id,
              dataURL: file.dataURL,
              created: file.created || Date.now(),
            }))
            if (fileData.length > 0) {
              excalidrawAPI.addFiles(fileData)
            }
          }
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
        {!isPrivate && connectionStatus === 'connected' && (
          <div className="bg-green-100 border border-green-300 rounded px-2 py-1 text-xs text-green-800">
            🟢 Connected - Live Collaboration
          </div>
        )}
        {!isPrivate && connectionStatus === 'connecting' && (
          <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-800">
            🔵 Connecting...
          </div>
        )}
        {!isPrivate && connectionStatus === 'disconnected' && (
          <div className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
            ⚪ Working Offline
          </div>
        )}
      </div>
      
      {!isPrivate && users.length > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow">
          👥 {users.length} {users.length === 1 ? 'user' : 'users'} online
        </div>
      )}

      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: {},
            toggleTheme: true,
          },
        }}
      />
    </div>
  )
}
