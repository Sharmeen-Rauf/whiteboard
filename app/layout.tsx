import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Company Meeting Whiteboard',
  description: 'Share your thoughts and what you\'re working on!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
