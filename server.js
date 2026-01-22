const { Server } = require('socket.io')
const http = require('http')

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const rooms = new Map() // roomId -> { users: Set, canvasState: [] }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', ({ roomId, userName, isPrivate }) => {
    socket.join(roomId)
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        canvasState: [],
        isPrivate: isPrivate === 'true',
      })
    }

    const room = rooms.get(roomId)
    room.users.add(userName || socket.id)
    
    // Send current canvas state to new user
    socket.emit('canvas-state', room.canvasState)
    
    // Notify others
    socket.to(roomId).emit('user-joined', Array.from(room.users))
    socket.emit('user-joined', Array.from(room.users))
    
    console.log(`${userName || socket.id} joined room ${roomId}`)
  })

  socket.on('drawing-action', ({ type, object, objectId, properties, roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return

    if (type === 'add' && object) {
      object.id = objectId || `obj_${Date.now()}_${Math.random()}`
      room.canvasState.push(object)
    } else if (type === 'modify' && objectId) {
      const index = room.canvasState.findIndex((obj) => obj.id === objectId)
      if (index !== -1) {
        room.canvasState[index] = { ...room.canvasState[index], ...properties }
      }
    } else if (type === 'remove' && objectId) {
      room.canvasState = room.canvasState.filter((obj) => obj.id !== objectId)
    } else if (type === 'clear') {
      room.canvasState = []
    }

    // Broadcast to all users in room except sender
    socket.to(roomId).emit('drawing-update', { type, object, objectId, properties })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id)
        io.to(roomId).emit('user-left', Array.from(room.users))
      }
    })
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})
