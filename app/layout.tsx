import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400']
})

export const metadata: Metadata = {
  title: 'FDCircle UAT Portal',
  description: 'Flight API Integration & Testing Portal — explore bookable sectors, test endpoints, and integrate outsource flight booking APIs.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.className}`} style={jetbrainsMono.style}>
      <body>{children}</body>
    </html>
  )
}
