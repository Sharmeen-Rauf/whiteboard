'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  async () => {
    try {
      const excalidrawModule = await import('@excalidraw/excalidraw')
      return { default: excalidrawModule.Excalidraw }
    } catch (error) {
      console.error('Failed to load Excalidraw:', error)
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load Excalidraw</p>
              <p className="text-sm text-gray-500">Please refresh the page</p>
            </div>
          </div>
        ),
      }
    }
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Excalidraw...</p>
        </div>
      </div>
    ),
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
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper function to sanitize appState (remove non-serializable properties)
  const sanitizeAppState = useCallback((appState: AppState): Partial<AppState> => {
    const sanitized = { ...appState }
    // Remove collaborators as it's a Map and causes issues when serialized
    if ('collaborators' in sanitized) {
      delete (sanitized as any).collaborators
    }
    // Remove other non-serializable properties if any
    if ('socket' in sanitized) {
      delete (sanitized as any).socket
    }
    return sanitized
  }, [])

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

    // Check if socket.io-client is available
    if (typeof io === 'undefined') {
      console.error('Socket.io client not available')
      setConnectionStatus('disconnected')
      return
    }

    try {
      setConnectionStatus('connecting')
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      
      // Ensure URL has proper protocol
      if (socketUrl && !socketUrl.startsWith('http://') && !socketUrl.startsWith('https://')) {
        socketUrl = `https://${socketUrl}`
      }
      
      // Remove trailing slash if present
      socketUrl = socketUrl.replace(/\/$/, '')
      
      console.log('Connecting to Socket.io server:', socketUrl)
      
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('✅ Connected to Socket.io server:', socket.id)
        setConnectionStatus('connected')
        socket.emit('join-room', { roomId, userName, isPrivate: isPrivate.toString() })
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message)
        console.error('Socket URL was:', socketUrl)
        setConnectionStatus('disconnected')
      })

      socket.on('disconnect', (reason) => {
        console.log('⚠️ Disconnected from server:', reason)
        setConnectionStatus('disconnected')
      })
      
      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts')
        setConnectionStatus('connected')
        socket.emit('join-room', { roomId, userName, isPrivate: isPrivate.toString() })
      })

      socket.on('user-joined', (userList: string[]) => {
        setUsers(userList)
      })

      socket.on('user-left', (userList: string[]) => {
        setUsers(userList)
      })

      // Receive updates from other users
      socket.on('excalidraw-update', (data: { elements: any[], appState: any, files: BinaryFiles }) => {
        if (!excalidrawAPI) {
          console.warn('Excalidraw API not ready, skipping update')
          return
        }
        
        // Skip if this is our own change (prevent feedback loop)
        if (isLocalChangeRef.current) {
          isLocalChangeRef.current = false
          return
        }

        try {
          console.log('📥 Received remote update:', data.elements?.length || 0, 'elements')
          
          // Sanitize appState to remove collaborators if present
          const sanitizedAppState = data.appState ? sanitizeAppState(data.appState as AppState) : {}
          
          excalidrawAPI.updateScene({
            elements: data.elements || [],
            appState: sanitizedAppState,
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
          console.error('❌ Error applying remote update:', error)
        }
      })

      // Receive initial canvas state
      socket.on('excalidraw-state', (data: { elements: any[], appState: any, files: BinaryFiles }) => {
        if (!excalidrawAPI) return

        try {
          // Sanitize appState to remove collaborators if present
          const sanitizedAppState = data.appState ? sanitizeAppState(data.appState as AppState) : {}
          
          excalidrawAPI.updateScene({
            elements: data.elements || [],
            appState: sanitizedAppState,
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
        if (changeTimeoutRef.current) {
          clearTimeout(changeTimeoutRef.current)
          changeTimeoutRef.current = null
        }
        if (socket && socket.connected) {
          socket.disconnect()
        }
      }
    } catch (error) {
      console.error('Error initializing socket:', error)
      setConnectionStatus('disconnected')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName, isPrivate, sanitizeAppState])

  const handleChange = (
    elements: readonly any[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    // Sanitize appState before saving/sending
    const sanitizedAppState = sanitizeAppState(appState)
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      const data = {
        elements: Array.from(elements),
        appState: sanitizedAppState,
        files,
        version: 2,
        type: 'excalidraw',
      }
      localStorage.setItem(`excalidraw_${roomId}`, JSON.stringify(data))
    }

    // Broadcast to other users in real-time (if not private and connected)
    // Use throttling to avoid sending too many updates
    if (!isPrivate && socketRef.current && socketRef.current.connected) {
      // Clear previous timeout
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }
      
      // Set flag to prevent feedback loop
      isLocalChangeRef.current = true
      
      // Throttle updates (send every 100ms max)
      changeTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          console.log('📤 Sending update:', elements.length, 'elements')
          socketRef.current.emit('excalidraw-change', {
            roomId,
            elements: Array.from(elements),
            appState: sanitizedAppState,
            files,
          })
          
          // Reset flag after a short delay to allow remote updates
          setTimeout(() => {
            isLocalChangeRef.current = false
          }, 50)
        }
      }, 100)
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
          // Sanitize appState to remove collaborators if present
          const sanitizedAppState = sanitizeAppState(data.appState as AppState)
          
          excalidrawAPI.updateScene({
            elements: data.elements,
            appState: sanitizedAppState,
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
  }, [excalidrawAPI, roomId, isReady, sanitizeAppState])

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
