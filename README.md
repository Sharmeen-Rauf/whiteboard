# Company Meeting Whiteboard - Next.js

A modern, collaborative whiteboard application built with Next.js, React, and TypeScript for companies to share thoughts, work updates, and meeting notes.

## Features

- ✅ **Add Notes**: Share your name, role, what you're working on, and links
- ✅ **Drag & Drop**: Move notes anywhere on the whiteboard
- ✅ **Persistent Storage**: Notes are saved in browser localStorage
- ✅ **Export**: Download all notes as JSON
- ✅ **Modern UI**: Built with Tailwind CSS and React
- ✅ **TypeScript**: Fully typed for better development experience
- ✅ **Customizable Colors**: Choose colors for your notes
- ✅ **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## How to Use

1. Click "Add Your Note" to add a new note
2. Fill in your information:
   - Your name (required)
   - Title/Role (optional)
   - What you're working on / Thoughts (required)
   - Links (one per line, optional)
   - Note color (optional)
3. Drag notes around the whiteboard to organize them
4. Click the × button to delete a note
5. Use "Export" to download all notes as JSON

## Project Structure

```
.
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main whiteboard page
│   └── globals.css     # Global styles
├── components/
│   ├── Note.tsx        # Note component with drag & drop
│   └── NoteModal.tsx   # Modal for adding/editing notes
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Deploy with one click

### Other Platforms

- **Netlify**: Connect your GitHub repo
- **AWS Amplify**: Follow Next.js deployment guide
- **Docker**: Build and deploy as container

## Future Enhancements

- Real-time collaboration (WebSockets/Socket.io)
- User authentication
- Cloud storage (database integration)
- Image uploads
- QR code generation
- Print/PDF export
- Multiple whiteboards/rooms
- Comments and reactions on notes

## License

MIT
