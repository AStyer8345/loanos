import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { OutreachChatProvider } from '@/components/outreach/OutreachChatContext'
import LoanOSChat from '@/components/crm/LoanOSChat'
import { getBranding } from '@/lib/branding/getBranding'
import { ThemeProvider } from '@/components/ThemeProvider'

const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono' })
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'LoanOS',
  description: 'Mortgage operations platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const branding = await getBranding()

  // Inject brand color as CSS custom property — hex validated before storage
  const cssVars = branding.brandColor
    ? `:root { --brand-primary: ${branding.brandColor}; }`
    : ''

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {cssVars && (
          <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        )}
      </head>
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} ${ibmPlexSans.className} antialiased`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <ThemeProvider>
          <OutreachChatProvider>
            {children}
            <LoanOSChat />
          </OutreachChatProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
