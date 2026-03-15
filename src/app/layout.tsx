import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { OutreachChatProvider } from '@/components/outreach/OutreachChatContext'
import OutreachChat from '@/components/outreach/OutreachChat'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono' })
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'LoanOS',
  description: 'Mortgage operations platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.className} bg-gray-950 antialiased`}>
        <OutreachChatProvider>
          {children}
          <OutreachChat />
        </OutreachChatProvider>
      </body>
    </html>
  )
}
