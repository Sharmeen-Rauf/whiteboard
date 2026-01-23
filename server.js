const { Server } = require('socket.io')
const http = require('http')

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const rooms = new Map() // roomId -> { users: Set, excalidrawState: { elements, appState, files } }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', ({ roomId, userName, isPrivate }) => {
    socket.join(roomId)
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        excalidrawState: {
          elements: [],
          appState: {},
          files: {},
        },
        isPrivate: isPrivate === 'true',
      })
    }

    const room = rooms.get(roomId)
    const userKey = userName || socket.id
    room.users.add(userKey)
    
    // Send current Excalidraw state to new user
    if (room.excalidrawState.elements.length > 0) {
      socket.emit('excalidraw-state', room.excalidrawState)
    }
    
    // Notify others
    socket.to(roomId).emit('user-joined', Array.from(room.users))
    socket.emit('user-joined', Array.from(room.users))
    
    console.log(`${userKey} joined room ${roomId}`)
  })

  socket.on('excalidraw-change', ({ roomId, elements, appState, files }) => {
    const room = rooms.get(roomId)
    if (!room || room.isPrivate) return

    // Update room state
    room.excalidrawState = {
      elements: elements || [],
      appState: appState || {},
      files: files || {},
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('excalidraw-update', {
      elements,
      appState,
      files,
    })
  })

  // Legacy support for old drawing actions (if needed)
  socket.on('drawing-action', ({ type, object, objectId, properties, roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return

    if (type === 'add' && object) {
      object.id = objectId || `obj_${Date.now()}_${Math.random()}`
      if (!room.excalidrawState) {
        room.excalidrawState = { elements: [], appState: {}, files: {} }
      }
      room.excalidrawState.elements.push(object)
    } else if (type === 'modify' && objectId) {
      const index = room.excalidrawState?.elements?.findIndex((obj) => obj.id === objectId)
      if (index !== -1 && index !== undefined) {
        room.excalidrawState.elements[index] = { ...room.excalidrawState.elements[index], ...properties }
      }
    } else if (type === 'remove' && objectId) {
      room.excalidrawState.elements = room.excalidrawState.elements.filter((obj) => obj.id !== objectId)
    } else if (type === 'clear') {
      room.excalidrawState.elements = []
    }

    socket.to(roomId).emit('drawing-update', { type, object, objectId, properties })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      const userToRemove = Array.from(room.users).find(user => user === socket.id)
      if (userToRemove) {
        room.users.delete(userToRemove)
        io.to(roomId).emit('user-left', Array.from(room.users))
      }
    })
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})
