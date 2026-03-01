export const metadata = {
  title: 'Universal Video Downloader',
  description: 'Download videos from YouTube, Facebook, and Instagram in premium quality.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Downloader',
  },
}

export const viewport = {
  themeColor: '#09090e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
