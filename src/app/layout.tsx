import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { CookiesProvider } from 'next-client-cookies/server'

import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { cn } from '@/lib/utils'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'Mark AI: Exam Grading System',
	description: 'Automated exam grading system with OCR'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen bg-background font-sans antialiased',
					geistSans.variable,
					geistMono.variable
				)}
				>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					<CookiesProvider>{children}</CookiesProvider>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	)
}


