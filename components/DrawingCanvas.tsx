'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { DrawingTool, DrawingState, createCanvas, setupTool, drawShape } from '@/lib/drawing'
import { io, Socket } from 'socket.io-client'
import type { Canvas as FabricCanvas, Object as FabricObject, IEvent } from 'fabric'

interface DrawingCanvasProps {
  roomId: string
  isPrivate?: boolean
  userName?: string
  tool: DrawingTool
  drawingState: DrawingState
  onClear?: () => void
}

export default function DrawingCanvas({ 
  roomId, 
  isPrivate = false, 
  userName = 'Anonymous',
  tool,
  drawingState,
  onClear,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [users, setUsers] = useState<string[]>([])
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return

    let cleanup: (() => void) | undefined

    createCanvas(canvasRef.current).then((canvas) => {
      fabricCanvasRef.current = canvas
      setIsCanvasReady(true)

      // Handle window resize
      const handleResize = () => {
        if (canvas && canvasRef.current) {
          canvas.setWidth(window.innerWidth)
          canvas.setHeight(window.innerHeight - 60)
          canvas.renderAll()
        }
      }
      window.addEventListener('resize', handleResize)

      cleanup = () => {
        window.removeEventListener('resize', handleResize)
        canvas.dispose()
      }
    }).catch((error) => {
      console.error('Error initializing canvas:', error)
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Initialize Socket.io connection (only for public boards)
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
        // Continue working locally even if server is not available
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

      socket.on('drawing-update', async (data: any) => {
        if (!fabricCanvasRef.current) return
        
        try {
          const fabric = (await import('fabric')).default
          
          // Load object from server
          if (data.type === 'add') {
            fabric.util.enlivenObjects([data.object], (objects: FabricObject[]) => {
              objects.forEach((obj) => {
                // Check if object already exists
                const existing = fabricCanvasRef.current?.getObjects().find((o: any) => o.id === data.object?.id)
                if (!existing) {
                  ;(obj as any).id = data.object?.id || `obj_${Date.now()}_${Math.random()}`
                  fabricCanvasRef.current?.add(obj)
                }
              })
              fabricCanvasRef.current?.renderAll()
            })
          } else if (data.type === 'modify') {
            const obj = fabricCanvasRef.current.getObjects().find((o: any) => o.id === data.objectId)
            if (obj) {
              obj.set(data.properties)
              fabricCanvasRef.current.renderAll()
            }
          } else if (data.type === 'remove') {
            const obj = fabricCanvasRef.current.getObjects().find((o: any) => o.id === data.objectId)
            if (obj) {
              fabricCanvasRef.current.remove(obj)
              fabricCanvasRef.current.renderAll()
            }
          } else if (data.type === 'clear') {
            fabricCanvasRef.current.clear()
            fabricCanvasRef.current.backgroundColor = '#ffffff'
            fabricCanvasRef.current.renderAll()
          }
        } catch (error) {
          console.error('Error processing drawing update:', error)
        }
      })

      socket.on('canvas-state', async (objects: any[]) => {
        if (!fabricCanvasRef.current) return
        try {
          const fabric = (await import('fabric')).default
          fabricCanvasRef.current.clear()
          fabric.util.enlivenObjects(objects, (enlivened: FabricObject[]) => {
            enlivened.forEach((obj) => {
              fabricCanvasRef.current?.add(obj)
            })
            fabricCanvasRef.current?.renderAll()
          })
        } catch (error) {
          console.error('Error loading canvas state:', error)
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

  // Setup tool
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return
    setupTool(fabricCanvasRef.current, tool, drawingState).catch((error) => {
      console.error('Error setting up tool:', error)
    })
  }, [tool, drawingState, isCanvasReady])

  // Handle canvas events
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return
    const canvas = fabricCanvasRef.current

    const handleMouseDown = (e: IEvent) => {
      if (tool === 'select' || tool === 'freehand') return
      
      const pointer = canvas.getPointer(e.e)
      setIsDrawing(true)
      setStartPos({ x: pointer.x, y: pointer.y })
    }

    const handleMouseMove = (e: IEvent) => {
      // Can be used for preview drawing
    }

    const handleMouseUp = async (e: IEvent) => {
      if (!isDrawing || tool === 'select' || tool === 'freehand') return
      
      const pointer = canvas.getPointer(e.e)
      
      try {
        await drawShape(canvas, tool, drawingState, startPos.x, startPos.y, pointer.x, pointer.y)
        
        // Send to server if connected and not private
        if (socketRef.current && socketRef.current.connected && !isPrivate) {
          const objects = canvas.getObjects()
          const lastObject = objects[objects.length - 1]
          if (lastObject) {
            const objId = (lastObject as any).id || `obj_${Date.now()}_${Math.random()}`
            ;(lastObject as any).id = objId
            socketRef.current.emit('drawing-action', {
              type: 'add',
              object: lastObject.toObject(),
              roomId,
            })
          }
        }
      } catch (error) {
        console.error('Error drawing shape:', error)
      }
      
      setIsDrawing(false)
    }

    const handleObjectModified = (e: IEvent) => {
      if (!socketRef.current || isPrivate) return
      const obj = e.target
      if (obj && socketRef.current.connected) {
        const objId = (obj as any).id || `obj_${Date.now()}_${Math.random()}`
        ;(obj as any).id = objId
        socketRef.current.emit('drawing-action', {
          type: 'modify',
          objectId: objId,
          properties: obj.toObject(),
          roomId,
        })
      }
    }

    const handleObjectRemoved = (e: IEvent) => {
      if (!socketRef.current || !e.target || isPrivate) return
      if (socketRef.current.connected) {
        socketRef.current.emit('drawing-action', {
          type: 'remove',
          objectId: (e.target as any).id,
          roomId,
        })
      }
    }

    const handlePathCreated = async (e: IEvent) => {
      if (!socketRef.current || isPrivate) return
      const path = e.path
      if (path && socketRef.current.connected) {
        const pathId = (path as any).id || `obj_${Date.now()}_${Math.random()}`
        ;(path as any).id = pathId
        socketRef.current.emit('drawing-action', {
          type: 'add',
          object: path.toObject(),
          roomId,
        })
      }
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:removed', handleObjectRemoved)
    canvas.on('path:created', handlePathCreated)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('object:modified', handleObjectModified)
      canvas.off('object:removed', handleObjectRemoved)
      canvas.off('path:created', handlePathCreated)
    }
  }, [tool, isDrawing, startPos, drawingState, roomId, isCanvasReady, isPrivate])

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = '#ffffff'
    fabricCanvasRef.current.renderAll()
    
    // Send to server if connected and not private
    if (socketRef.current && socketRef.current.connected && !isPrivate) {
      socketRef.current.emit('drawing-action', {
        type: 'clear',
        roomId,
      })
    }
  }, [roomId, isPrivate])

  // Expose clear function to parent
  useEffect(() => {
    if (onClear && typeof window !== 'undefined') {
      ;(window as any)[`clear_${roomId}`] = clearCanvas
    }
  }, [clearCanvas, roomId, onClear])

  if (typeof window === 'undefined') {
    return <div>Loading...</div>
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="border border-gray-300" />
      
      {/* Status indicators */}
      <div className="absolute top-2 left-2 flex gap-2">
        {isPrivate && (
          <div className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs text-yellow-800">
            🔒 Private Board
          </div>
        )}
        {!isPrivate && connectionStatus === 'connected' && (
          <div className="bg-green-100 border border-green-300 rounded px-2 py-1 text-xs text-green-800">
            🟢 Connected
          </div>
        )}
        {!isPrivate && connectionStatus === 'connecting' && (
          <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-800">
            🔵 Connecting...
          </div>
        )}
        {!isPrivate && connectionStatus === 'disconnected' && socketRef.current && (
          <div className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
            ⚪ Working Offline
          </div>
        )}
      </div>
      
      {!isPrivate && users.length > 0 && (
        <div className="absolute top-2 right-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs">
          👥 {users.length} {users.length === 1 ? 'user' : 'users'}
        </div>
      )}
    </div>
  )
}
