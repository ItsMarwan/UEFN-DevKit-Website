import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'UEFN Helper Bot - Manage Your Game Server',
  description: 'The ultimate Discord bot for UEFN management and tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-black text-black dark:text-white transition-colors">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
