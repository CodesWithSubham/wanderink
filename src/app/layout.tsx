import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'WanderInk - Every walk becomes a story',
    template: '%s | WanderInk',
  },
  description: 'Transform your outdoor explorations into beautiful, AI-powered journals. Upload 3-5 photos and get a personalized adventure story.',
  keywords: ['travel journal', 'outdoor exploration', 'AI storytelling', 'photo journal', 'adventure'],
  authors: [{ name: 'WanderInk' }],
  creator: 'WanderInk',
  publisher: 'WanderInk',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wanderink.app',
    siteName: 'WanderInk',
    title: 'WanderInk - Every walk becomes a story',
    description: 'Transform your outdoor explorations into beautiful, AI-powered journals.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WanderInk - AI-powered outdoor exploration journal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WanderInk - Every walk becomes a story',
    description: 'Transform your outdoor explorations into beautiful, AI-powered journals.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}