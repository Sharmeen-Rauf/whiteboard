const { Server } = require('socket.io')
const http = require('http')

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
        'https://localhost:3000',
      ].filter(Boolean)
      
      // In production, allow all origins from Vercel
      if (!origin || allowedOrigins.some(allowed => origin.includes(allowed?.replace(/^https?:\/\//, '').split('/')[0]))) {
        callback(null, true)
      } else {
        console.log('CORS blocked origin:', origin)
        callback(null, true) // Allow all for now, can restrict later
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
})

const rooms = new Map() // roomId -> { users: Set, excalidrawState: { elements, appState, files } }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', ({ roomId, userName, isPrivate }) => {
    socket.join(roomId)
    console.log(`🔵 Socket ${socket.id} joining room: ${roomId}`)
    
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
      console.log(`✨ Created new room: ${roomId}`)
    }

    const room = rooms.get(roomId)
    const userKey = userName || socket.id
    room.users.add(userKey)
    
    console.log(`👤 ${userKey} joined room ${roomId} (${room.users.size} users)`)
    
    // Send current Excalidraw state to new user
    if (room.excalidrawState && room.excalidrawState.elements.length > 0) {
      console.log(`📤 Sending initial state to new user: ${room.excalidrawState.elements.length} elements`)
      socket.emit('excalidraw-state', room.excalidrawState)
    }
    
    // Notify others
    const userList = Array.from(room.users)
    socket.to(roomId).emit('user-joined', userList)
    socket.emit('user-joined', userList)
    
    console.log(`✅ ${userKey} successfully joined room ${roomId}`)
  })

  socket.on('excalidraw-change', ({ roomId, elements, appState, files }) => {
    const room = rooms.get(roomId)
    if (!room) {
      console.warn('Room not found:', roomId)
      return
    }
    
    if (room.isPrivate) {
      console.log('Ignoring change for private room:', roomId)
      return
    }

    console.log(`📨 Received change for room ${roomId}:`, elements?.length || 0, 'elements')

    // Update room state
    room.excalidrawState = {
      elements: elements || [],
      appState: appState || {},
      files: files || {},
    }

    // Broadcast to all other users in the room (excluding sender)
    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
    console.log(`📤 Broadcasting to ${clientsInRoom.length - 1} other clients in room ${roomId}`)
    
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
