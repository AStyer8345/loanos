import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OutreachChatProvider } from '@/components/outreach/OutreachChatContext'
import OutreachChat from '@/components/outreach/OutreachChat'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-gray-950 antialiased`}>
        <OutreachChatProvider>
          {children}
          <OutreachChat />
        </OutreachChatProvider>
      </body>
    </html>
  )
}
