import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        <Script id="excalidraw-asset-path" strategy="beforeInteractive">
          {`if (typeof window !== 'undefined') { window.EXCALIDRAW_ASSET_PATH = window.location.origin; }`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
