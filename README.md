# Company Whiteboard - Collaborative Drawing Board

A real-time collaborative whiteboard application built with Next.js and Excalidraw. Employees can draw, write, and collaborate in real-time on shared or private whiteboards using the powerful Excalidraw editor.

## Features

### 🎨 Excalidraw Features
- **All Excalidraw Tools** - Rectangle, Circle, Diamond, Arrow, Line, Free-draw, Eraser
- **Hand-drawn Style** - Beautiful hand-drawn like diagrams
- **Infinite Canvas** - Zoom and pan support
- **Undo/Redo** - Full history support
- **Export** - Export to PNG, SVG & clipboard
- **Dark Mode** - Toggle theme
- **Image Support** - Add images to canvas
- **Shape Libraries** - Access to shape libraries
- **Arrow Binding** - Smart arrow connections
- **Text Support** - Add and edit text

### 👥 Real-Time Collaboration
- **Live Updates** - See what others are drawing in real-time
- **User Presence** - See who's currently in the room
- **Multi-User Support** - Multiple employees can draw simultaneously
- **Private Boards** - Option to create private boards (only you can see)
- **Public Boards** - Share room ID for team collaboration

### 📝 Note System (Original)
- Add text notes with links
- Drag and drop notes
- Search and filter
- Categories and tags
- Export functionality

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Excalidraw** - Professional whiteboard library
- **Socket.io** - Real-time WebSocket communication (for future collaboration)
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Start the development servers:**

**Option 1: Run both servers separately (recommended for development)**

Terminal 1 - Next.js app:
```bash
npm run dev
```

Terminal 2 - Socket.io server:
```bash
npm run server
```

**Option 2: Use concurrently (if installed):**
```bash
npm run dev:all
```

4. **Open the application:**
- Next.js app: [http://localhost:3000](http://localhost:3000)
- Socket.io server: [http://localhost:3001](http://localhost:3001)

## Usage

### Creating a Drawing Board

1. Click the **"🎨 Drawing Board"** button on the main page
2. Enter your name when prompted
3. Choose if you want a private board (only you) or public (shareable)
4. Start drawing!

### Sharing a Board

1. Copy the room ID from the URL (e.g., `/whiteboard/room_123456`)
2. Share the full URL with your team
3. Everyone who joins will see the same whiteboard in real-time

### Drawing Tools

- **Select Tool**: Click and drag to move objects, resize, or modify
- **Shapes**: Click and drag to draw rectangles, circles, triangles
- **Line/Arrow**: Click start point, drag to end point
- **Text**: Click where you want text, double-click to edit
- **Freehand**: Click and drag to draw freely
- **Colors**: Use color pickers to change stroke and fill colors
- **Width**: Adjust slider to change line thickness

### Private vs Public Boards

- **Public Board**: Anyone with the room URL can join and collaborate
- **Private Board**: Only you can see and edit (others can't join even with the URL)

## Project Structure

```
.
├── app/
│   ├── page.tsx              # Main page with notes
│   ├── whiteboard/
│   │   └── [roomId]/
│   │       └── page.tsx      # Drawing board page
│   └── globals.css           # Global styles
├── components/
│   ├── DrawingCanvas.tsx     # Canvas component with Fabric.js
│   ├── DrawingToolbar.tsx    # Toolbar with all drawing tools
│   ├── Note.tsx              # Note component
│   └── NoteModal.tsx         # Modal for adding notes
├── lib/
│   └── drawing.ts            # Drawing utilities
├── server.js                 # Socket.io server
└── package.json
```

## Deployment

### Vercel (Recommended)

1. **Deploy Next.js app to Vercel:**
   - Push code to GitHub
   - Import repository on Vercel
   - Add environment variables in Vercel dashboard

2. **Deploy Socket.io server:**
   - Deploy `server.js` to a Node.js hosting service (Railway, Render, Heroku, etc.)
   - Update `NEXT_PUBLIC_SOCKET_URL` in Vercel to point to your Socket.io server

### Environment Variables for Production

```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
PORT=3001
```

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Future Enhancements

- [ ] Image upload support
- [ ] Undo/Redo functionality
- [ ] Zoom and pan controls
- [ ] Export as PDF
- [ ] Board templates
- [ ] User authentication
- [ ] Persistent board storage
- [ ] Comments and annotations
- [ ] Video/audio chat integration
- [ ] Mobile touch support

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
