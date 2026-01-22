'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import fabric from 'fabric'
import { DrawingTool, DrawingState, createCanvas, setupTool, drawShape } from '@/lib/drawing'
import { io, Socket } from 'socket.io-client'
import type { Canvas as FabricCanvas } from 'fabric'

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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = createCanvas(canvasRef.current)
    fabricCanvasRef.current = canvas

    // Handle window resize
    const handleResize = () => {
      if (canvas && canvasRef.current) {
        canvas.setWidth(window.innerWidth)
        canvas.setHeight(window.innerHeight - 60)
        canvas.renderAll()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.dispose()
    }
  }, [])

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to server')
      socket.emit('join-room', { roomId, userName, isPrivate: isPrivate.toString() })
    })

    socket.on('user-joined', (userList: string[]) => {
      setUsers(userList)
    })

    socket.on('user-left', (userList: string[]) => {
      setUsers(userList)
    })

    socket.on('drawing-update', (data: any) => {
      if (!fabricCanvasRef.current) return
      
      // Load object from server
      if (data.type === 'add') {
        fabric.util.enlivenObjects([data.object], (objects: fabric.Object[]) => {
          objects.forEach((obj) => {
            fabricCanvasRef.current?.add(obj)
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
    })

    socket.on('canvas-state', (objects: any[]) => {
      if (!fabricCanvasRef.current) return
      fabricCanvasRef.current.clear()
      fabric.util.enlivenObjects(objects, (enlivened: fabric.Object[]) => {
        enlivened.forEach((obj) => {
          fabricCanvasRef.current?.add(obj)
        })
        fabricCanvasRef.current?.renderAll()
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [roomId, userName, isPrivate])

  // Setup tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return
    setupTool(fabricCanvasRef.current, tool, drawingState)
  }, [tool, drawingState])

  // Handle canvas events
  useEffect(() => {
    if (!fabricCanvasRef.current) return
    const canvas = fabricCanvasRef.current

    const handleMouseDown = (e: fabric.IEvent) => {
      if (tool === 'select' || tool === 'freehand') return
      
      const pointer = canvas.getPointer(e.e)
      setIsDrawing(true)
      setStartPos({ x: pointer.x, y: pointer.y })
    }

    const handleMouseMove = (e: fabric.IEvent) => {
      if (!isDrawing || tool === 'select' || tool === 'freehand') return
      
      const pointer = canvas.getPointer(e.e)
      // Preview drawing (optional)
    }

    const handleMouseUp = (e: fabric.IEvent) => {
      if (!isDrawing || tool === 'select' || tool === 'freehand') return
      
      const pointer = canvas.getPointer(e.e)
      drawShape(canvas, tool, drawingState, startPos.x, startPos.y, pointer.x, pointer.y)
      
      // Send to server
      const objects = canvas.getObjects()
      const lastObject = objects[objects.length - 1]
      if (lastObject && socketRef.current) {
        ;(lastObject as any).id = `obj_${Date.now()}_${Math.random()}`
        socketRef.current.emit('drawing-action', {
          type: 'add',
          object: lastObject.toObject(),
          roomId,
        })
      }
      
      setIsDrawing(false)
    }

    const handleObjectModified = (e: fabric.IEvent) => {
      if (!socketRef.current) return
      const obj = e.target
      if (obj) {
        ;(obj as any).id = (obj as any).id || `obj_${Date.now()}_${Math.random()}`
        socketRef.current.emit('drawing-action', {
          type: 'modify',
          objectId: (obj as any).id,
          properties: obj.toObject(),
          roomId,
        })
      }
    }

    const handleObjectRemoved = (e: fabric.IEvent) => {
      if (!socketRef.current || !e.target) return
      socketRef.current.emit('drawing-action', {
        type: 'remove',
        objectId: (e.target as any).id,
        roomId,
      })
    }

    const handlePathCreated = (e: fabric.IEvent) => {
      if (!socketRef.current) return
      const path = e.path
      if (path) {
        ;(path as any).id = `obj_${Date.now()}_${Math.random()}`
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
  }, [tool, isDrawing, startPos, drawingState, roomId])

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current || !socketRef.current) return
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = '#ffffff'
    fabricCanvasRef.current.renderAll()
    socketRef.current.emit('drawing-action', {
      type: 'clear',
      roomId,
    })
  }, [roomId])

  // Expose clear function to parent via ref
  useEffect(() => {
    if (onClear) {
      // Store clear function in a way parent can access
      ;(window as any)[`clear_${roomId}`] = clearCanvas
    }
  }, [clearCanvas, roomId, onClear])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="border border-gray-300" />
      {users.length > 0 && (
        <div className="absolute top-2 right-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs">
          👥 {users.length} {users.length === 1 ? 'user' : 'users'}
        </div>
      )}
    </div>
  )
}
