export const metadata = {
  title: 'Universal Video Downloader',
  description: 'Download videos from YouTube, Facebook, and Instagram in premium quality.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
